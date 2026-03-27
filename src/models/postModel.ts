import mongoose from "mongoose";
import {RawPost} from "../types/post";

const postSchema = new mongoose.Schema<RawPost>({
    description: {
        type: String,
        required: true,
    },
    imgUrl: {
        type: String,
        required: true,
    },
    creationDate: {
        type: Date,
        required: true,
    },
    likeCount: {
        type: Number,
        default: 0,
        min: 0,
    },
    commentCount: {
        type: Number,
        default: 0,
        min: 0,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
    },
    descriptionVector: {
        type: [Number],
    }
});

postSchema.index({
    creationDate: -1,
    _id: -1,
});

const model = mongoose.model("post", postSchema);

model.createSearchIndex({
    name: "vector_search",
    type: "vectorSearch",
    definition: {
        fields: [
            {
                type: 'vector',
                path: "descriptionVector",
                numDimensions: 384,
                similarity: 'cosine'
            }
        ]
    }
})

export default model
