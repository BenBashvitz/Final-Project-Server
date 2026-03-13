import { Types } from "mongoose";

export type Like = {
  _id: Types.ObjectId;
  postId: Types.ObjectId;
  userId: Types.ObjectId;
};
