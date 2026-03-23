import z from "zod";
import { CreationDateSchema } from "./common";

export const CommentBodySchema = z.object({
  message: z.string(),
  creationDate: CreationDateSchema,
});
