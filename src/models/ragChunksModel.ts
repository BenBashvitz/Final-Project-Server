import mongoose from "mongoose";
import {RawRagChunk} from "../types/ragChunks";

const ragChunksSchema = new mongoose.Schema<RawRagChunk>({
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "post",
        required: true,
    },
    chunkIndex: {
        type: Number,
        required: true,
    },
    text: {
        type: String,
        required: true,
    },
    embedding: {
        type: [Number],
        required: true,
    },
});

export default mongoose.model("ragChunks", ragChunksSchema);
