import { Types } from "mongoose";

export type Like = {
  _id: Types.ObjectId;
  postId: Types.ObjectId;
  userId: Types.ObjectId;
};

export type LikeResponse = {
  _id: string;
  likeCount: number;
};
