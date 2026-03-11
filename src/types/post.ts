import { Types } from "mongoose";
import { PostUser } from "./user";

export type Cursor = {
  _id: RawPost["_id"] | null;
  creationDate: RawPost["creationDate"] | null;
};

export type RawPost = {
  _id: Types.ObjectId;
  imgUrl?: string;
  description: string;
  userId: Types.ObjectId;
  likeCount: number;
  commentCount: number;
  creationDate: Date;
};

export type PostFilters = {
  cursor: string;
};

export type Post = Omit<RawPost, "userId"> & {
  user: PostUser;
  isLikedByCurrentUser: boolean;
};

export type PostPage = {
  posts: Post[];
  nextCursor: Cursor;
};
