import { Types } from "mongoose";

export type Like = {
  _id: string;
  postId: Types.ObjectId;
  userId: Types.ObjectId;
};
