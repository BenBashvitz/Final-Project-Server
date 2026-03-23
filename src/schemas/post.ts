import z from "zod";
import { CreationDateSchema, IdSchema } from "./common";

const CursorSchema = z.object({
  _id: IdSchema,
  creationDate: CreationDateSchema,
});

export const GetAllPostsQueryParams = z.object({
  cursor: z
    .string()
    .optional()
    .transform((value, ctx) => {
      if (!value) return undefined;
      try {
        return JSON.parse(value);
      } catch (error) {
        ctx.addIssue({
          format: "json_string",
          code: "invalid_format",
          message: "Cursor must be a valid JSON string",
          input: value,
        });

        return z.NEVER;
      }
    })
    .pipe(CursorSchema.optional()),
});

export const UpdatePostBody = z.object({
  description: z.string(),
  imgUrl: z.string(),
});

export const PostInputSchema = z.object({
  ...UpdatePostBody.shape,
  creationDate: CreationDateSchema,
});
