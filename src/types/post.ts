import { Types } from "mongoose";

export type PostInput = Pick<RawPost, "description" | "imgUrl">;

export type RawPost = {
  _id: Types.ObjectId;
  imgUrl: string;
  description: string;
  sender: Types.ObjectId;
  likeCount: number;
  commentCount: number;
};

export type Post = Omit<RawPost, "_id" | "sender"> & {
  id: string;
  sender: string;
};
