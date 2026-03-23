export type CommentInput = {
  message: string;
  creationDate: string;
};

export type CommentInputWithUserAndPostIds = CommentInput & {
  userId: string;
  postId: string;
};
