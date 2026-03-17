import { RawPost } from "../../types/post";

export type PostInput = Pick<
  RawPost,
  "description" | "imgUrl" | "likeCount"
> & {
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
