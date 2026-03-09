import { Types } from "mongoose";
import { PostSender } from "./user";

export type Cursor = {
  _id: RawPost["_id"];
  creationDate: RawPost["creationDate"];
};

export type PostInput = Pick<RawPost, "description" | "imgUrl">;

export type RawPost = {
  _id: Types.ObjectId;
  imgUrl: string;
  description: string;
  sender: Types.ObjectId;
  likeCount: number;
  commentCount: number;
  creationDate: Date;
};

export type PostFilters = {
  cursor: string;
};

export type Post = Omit<RawPost, "sender"> & {
  sender: PostSender;
  isLikedByCurrentUser: boolean;
};

export type PostPage = {
  posts: Post[];
  nextCursor: Cursor;
};
