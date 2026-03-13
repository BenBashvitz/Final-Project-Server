import mongoose from "mongoose";
import { Like } from "../types/like";

const likeSchema = new mongoose.Schema<Like>({
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "post",
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
});

likeSchema.index({ postId: 1, userId: 1 }, { unique: true });

export default mongoose.model("like", likeSchema);
