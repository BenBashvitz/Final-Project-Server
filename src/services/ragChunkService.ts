import {PostRagData, RawPost} from "../types/post";
import envVar from "../configs/envVar";
import {FeatureExtractionPipeline, pipeline} from "@xenova/transformers";
import ragChunksModel from "../models/ragChunksModel";
import mongoose from "mongoose";
import {ScoredRagChunk} from "../types/ragChunks";
import score from 'compute-cosine-similarity';
import postModel from "../models/postModel";

class RagChunkService {
    private textEmbedder: FeatureExtractionPipeline | null = null;

    saveRagChunksForPost = async (post: PostRagData): Promise<void> => {
        const chunks = this.chunkData(post.description);
        const embeddings = await this.generateEmbeddings(chunks);

        embeddings.map((embedding, chunkIndex) => {
            ragChunksModel.create({
                postId: post._id,
                embedding,
                chunkIndex,
                text: chunks[chunkIndex],
            });
        })
    }

    deleteRagChunksForPost = async (postId: mongoose.Types.ObjectId): Promise<void> => {
        await ragChunksModel.deleteMany({postId: postId});
    }

    updateRagChunksForPost = async (post: PostRagData): Promise<void> => {
        await this.deleteRagChunksForPost(post._id);
        await this.saveRagChunksForPost(post);
    }

    topKPostsByQuery = async (query: string): Promise<RawPost[]> => {
        const scoredRagChunks = await this.scoredAndSortedRagChunksByQuery(query);

        const postIds: mongoose.Types.ObjectId[] = [];

        scoredRagChunks.forEach(ragChunk => {
            if(!postIds.includes(ragChunk.postId)){
                postIds.push(ragChunk.postId);
            }
        })

        const topKPostIds = postIds.slice(0, envVar.RAG_TOP_K);

        const topKPosts = await postModel.find({
            _id: {
                $in: topKPostIds,
            },
        })

        return topKPosts.map(post => post.toObject())
    }

    private scoredAndSortedRagChunksByQuery = async (query: string): Promise<ScoredRagChunk[]> => {
        const queryEmbedding = await this.generateEmbedding(query);
        const ragChunks = await ragChunksModel.find({}).limit(envVar.RAG_NUM_OF_CANDIDATES);

        const scoredRagChunks = ragChunks.map(ragChunk => ({
            ...ragChunk.toObject(),
            score: score(ragChunk.embedding, queryEmbedding) ?? -1,
        }))

        return scoredRagChunks.sort((a, b) => b.score - a.score);
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