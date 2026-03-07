import mongoose from "mongoose";
import { Post } from "../types/post";

const postSchema = new mongoose.Schema<Post>({
  description: {
    type: String,
    required: true,
  },
  imgUrl: {
    type: String,
    required: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
});

export default mongoose.model("Post", postSchema);
