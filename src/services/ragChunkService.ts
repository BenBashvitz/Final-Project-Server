import { PostRagData, RawPost } from "../types/post";
import envVar from "../configs/envVar";
import { FeatureExtractionPipeline, pipeline } from "@xenova/transformers";
import ragChunksModel from "../models/ragChunksModel";
import mongoose from "mongoose";
import { RagChunkPage, RagChunkPageOptions, RagChunkPostPage, RawRagChunk, ScoredRagChunk } from "../types/ragChunks";
import score from 'compute-cosine-similarity';
import postModel from "../models/postModel";

class RagChunkService {
    private textEmbedder: FeatureExtractionPipeline | null = null;

    saveRagChunksForPost = async (post: PostRagData) => {
        const chunks = this.chunkData(post.description);
        const embeddings = await this.generateEmbeddings(chunks);

        const chunksToSave = embeddings.map((embedding, chunkIndex) => ({
            postId: post._id,
            embedding,
            chunkIndex,
            text: chunks[chunkIndex],
        }));

        return await ragChunksModel.insertMany(chunksToSave);
    }

    deleteRagChunksForPost = async (postId: mongoose.Types.ObjectId): Promise<void> => {
        await ragChunksModel.deleteMany({ postId: postId });
    }

    updateRagChunksForPost = async (post: PostRagData) => {
        await this.deleteRagChunksForPost(post._id);
        return await this.saveRagChunksForPost(post);
    }

    topKPostsByQuery = async (query: string, options: RagChunkPageOptions): Promise<RagChunkPostPage> => {
        const scoredRagChunksPage = await this.scoredAndSortedRagChunksByQuery(query, options);

        const uniquePostIdStrings = Array.from(new Set(scoredRagChunksPage.ragChunks.map(chunk => chunk.postId.toString())));
        const topKPostIds = uniquePostIdStrings.slice(0, envVar.RAG_TOP_K).map(id => new mongoose.Types.ObjectId(id));

        const topKPosts = await postModel.find({
            _id: {
                $in: topKPostIds,
            },
        })

        return {
            posts: topKPosts,
            nextRagChunkId: scoredRagChunksPage.nextId
        }
    }

    private scoredAndSortedRagChunksByQuery = async (query: string, options: RagChunkPageOptions): Promise<RagChunkPage> => {
        const queryEmbedding = await this.generateEmbedding(query);
        const ragChunks = await ragChunksModel.aggregate<RawRagChunk>([{
            $match: {
                ...(options.retryCount > 0 && options.nextId !== null && {
                    _id: { $lte: options.nextId },
                })
            },
        },
        { $sort: { _id: -1 } },
        { $limit: envVar.RAG_NUM_OF_CANDIDATES + 1 }]);

        const scoredRagChunks = ragChunks.map(ragChunk => ({
            ...ragChunk,
            score: score(ragChunk.embedding, queryEmbedding) ?? -1,
        })).filter(({ score }) => score > envVar.RAG_THRESHOLD);

        return {
            ragChunks: scoredRagChunks.sort((a, b) => b.score - a.score),
            nextId: ragChunks[ragChunks.length - 1]._id
        };
    }

    private generateEmbeddings = (chunks: string[]): Promise<number[][]> => {
        return Promise.all(chunks.map(chunk => this.generateEmbedding(chunk)))
    }

    private generateEmbedding = async (data: string): Promise<number[]> => {
        if (!this.textEmbedder) {
            this.textEmbedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
        }

        const output = await this.textEmbedder(data, {
            pooling: 'mean',
            normalize: true,
        });

        return Array.from(output.data);
    }

    private chunkData = (data: string): string[] => {
        const chunks: string[] = [];

        for (let i = 0; i < Math.ceil(data.length / envVar.RAG_CHUNK_SIZE); i++) {
            const start = i * (envVar.RAG_CHUNK_SIZE - envVar.RAG_CHUNK_OVERLAP);
            const end = Math.min(start + envVar.RAG_CHUNK_SIZE, data.length);
            chunks.push(data.slice(start, end))
        }

        return chunks;
    }
}

export default new RagChunkService();