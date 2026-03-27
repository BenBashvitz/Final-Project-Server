import mongoose from "mongoose";
import { RawUser } from "../types/user";

const userSchema = new mongoose.Schema<RawUser>({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  imgUrl: {
    type: String,
  },
  password: {
    type: String,
  },
  refreshTokens: {
    type: [String],
    required: true,
    default: [],
  },
});

export default mongoose.model("user", userSchema);
