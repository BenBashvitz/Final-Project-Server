import {PostRagData} from "../types/post";
import envVar from "../configs/envVar";
import {FeatureExtractionPipeline, pipeline} from "@xenova/transformers";
import ragChunksModel from "../models/ragChunksModel";
import mongoose from "mongoose";
import {RagChunkPage, RawRagChunk} from "../types/ragChunks";
import score from 'compute-cosine-similarity';

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

    topKRagChunksByQuery = async (query: string, nextId: mongoose.Types.ObjectId | null): Promise<RagChunkPage> => {
        const scoredRagChunksPage = await this.scoredAndSortedRagChunksByQuery(query, nextId);

        const topKRagChunks = scoredRagChunksPage.ragChunks.slice(0, envVar.RAG_TOP_K);

        return {
            ...scoredRagChunksPage,
            ragChunks: topKRagChunks,
        }
    }

    private scoredAndSortedRagChunksByQuery = async (query: string, nextId: mongoose.Types.ObjectId | null): Promise<RagChunkPage> => {
        const queryEmbedding = await this.generateEmbedding(query);
        const ragChunks = await ragChunksModel.aggregate<RawRagChunk>([{
            $match: {
                ...(nextId !== null && {
                    _id: { $lt: nextId },
                })
            },
        },
        { $sort: { _id: -1 } },
        { $limit: envVar.RAG_NUM_OF_CANDIDATES + 1 }]);

        const hasNextPage = ragChunks.length > envVar.RAG_NUM_OF_CANDIDATES

        if(hasNextPage) {
            ragChunks.pop()
        }

        const scoredRagChunks = ragChunks.map(ragChunk => ({
            ...ragChunk,
            score: score(ragChunk.embedding, queryEmbedding) ?? -1,
        })).filter(({ score, text }) => score > envVar.RAG_THRESHOLD);

        return {
            ragChunks: scoredRagChunks.sort((a, b) => b.score - a.score),
            nextId: hasNextPage ? ragChunks[ragChunks.length - 1]._id : null
        };
    }

    private generateEmbeddings = (chunks: string[]): Promise<number[][]> => {
        return Promise.all(chunks.map(chunk => this.generateEmbedding(chunk)))
    }

    private generateEmbedding = async (data: string): Promise<number[]> => {
        if (!this.textEmbedder) {
            this.textEmbedder = await pipeline('feature-extraction', "Xenova/bge-small-en-v1.5");
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