import Comment from "../../types/comment";

export const COMMENTS: Omit<Comment, "userId" | "postId">[] = [
  {
    message: "Test Comment",
    creationDate: new Date(),
  },
  {
    message: "Another Comment",
    creationDate: new Date(),
  },
];
