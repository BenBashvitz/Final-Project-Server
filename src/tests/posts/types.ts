import { RawPost } from "../../types/post";

export type PostInput = Pick<RawPost, "description" | "imgUrl"> & {
  creationDate: string;
};

export type PostInputWithSender = PostInput & {
  sender: string;
};
type TestCursor = {
  _id?: string | null;
  creationDate: string | null;
};

export type TestPostPage = {
  posts: PostInput[];
  nextCursor: TestCursor;
};
