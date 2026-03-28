import mongoose from "mongoose";

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