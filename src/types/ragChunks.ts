import mongoose from "mongoose";
import { RawPost } from "./post";

export type RawRagChunk = {
    _id: mongoose.Types.ObjectId;
    postId: mongoose.Types.ObjectId
    chunkIndex: number,
    text: string,
    embedding: number[]
}

export type RagChunk = Omit<RawRagChunk, "_id">;

export type ScoredRagChunk = RawRagChunk & {
    score: number
}

export type RagChunkPage = {
    nextId: mongoose.Types.ObjectId | null
    ragChunks: ScoredRagChunk[]
}

export type RagChunkPageOptions = {
    nextId: mongoose.Types.ObjectId | null
    retryCount: number
}

export type RagChunkPostPage = {
    nextRagChunkId: mongoose.Types.ObjectId | null
    posts: RawPost[]
}