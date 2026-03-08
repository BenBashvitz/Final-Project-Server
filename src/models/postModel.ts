import mongoose from "mongoose";
import { RawPost } from "../types/post";

const postSchema = new mongoose.Schema<RawPost>({
  description: {
    type: String,
    required: true,
  },
  imgUrl: {
    type: String,
    required: true,
  },
  likeCount: {
    type: Number,
    default: 0,
  },
  commentCount: {
    type: Number,
    default: 0,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
});

export default mongoose.model("Post", postSchema);
