import z from "zod";
import { CreationDateSchema, IdSchema } from "./common";

export const CommentBodySchema = z.object({
  message: z.string(),
  postId: IdSchema,
  creationDate: CreationDateSchema,
});

export const PostIdParamsSchema = z.object({
  postId: IdSchema,
});
