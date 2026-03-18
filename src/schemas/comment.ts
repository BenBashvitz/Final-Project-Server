import z from "zod";
import { CreationDateSchema, PostIdSchema } from "./post";

export const CommentBodySchema = z.object({
  message: z.string(),
  postId: PostIdSchema,
  creationDate: CreationDateSchema,
});
