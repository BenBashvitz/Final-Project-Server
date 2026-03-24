import { Types } from "mongoose";

type Comment = {
  message: string;
  postId: Types.ObjectId;
  userId: Types.ObjectId;
  creationDate: Date;
};

export default Comment;
