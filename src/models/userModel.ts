import mongoose from "mongoose";
import type { RawUser } from "../types/user";

const userSchema = new mongoose.Schema<RawUser>({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  username: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  refreshTokens: {
    type: [String],
    required: true,
  },
});

export default mongoose.model("user", userSchema);
