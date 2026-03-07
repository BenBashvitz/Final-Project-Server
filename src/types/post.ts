import { Types } from "mongoose";

export type PostInput = Pick<Post, "description" | "imgUrl">;

export type Post = {
  _id: Types.ObjectId;
  imgUrl: string;
  description: string;
  sender: Types.ObjectId;
};
