import { RawPost } from "../types/post";

export type PostInput = Pick<RawPost, "description" | "imgUrl"> & {
  creationDate: string;
};

export type PostInputWithUserId = PostInput & {
  userId: string;
};

type TestCursor = {
  _id?: string;
  creationDate: string;
};

export type TestPostPage = {
  posts: PostInput[];
  cursor: TestCursor | null;
};

export type CommentInput = {
  message: string;
  creationDate: string;
};

export type CommentInputWithUserAndPostIds = CommentInput & {
  userId: string;
  postId: string;
};
