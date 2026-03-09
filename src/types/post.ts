import { Types } from "mongoose";

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

// export type Post = Omit<RawPost, "_id" | "sender" | "creationDate"> & {
//   id: string;
//   sender: string;
//   creationDate: string;
// };

export type PostFilters = {
  cursor: string;
};

export type PostPage = {
  posts: RawPost[];
  nextCursor: Cursor;
};
