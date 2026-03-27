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

const model = mongoose.model("ragChunks", ragChunksSchema);

model.createSearchIndex({
    name: "vector_search",
    type: "vectorSearch",
    definition: {
        fields: [
            {
                type: 'vector',
                path: "embedding",
                numDimensions: 384,
                similarity: 'cosine'
            }
        ]
    }
})

export default model;
