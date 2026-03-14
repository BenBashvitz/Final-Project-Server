import mongoose from "mongoose";
import z from "zod";

const CursorSchema = z.object({
  _id: z.string().transform((value, ctx) => {
    try {
      return new mongoose.Types.ObjectId(value);
    } catch (error) {
      ctx.addIssue({
        format: "object_id",
        code: "invalid_format",
        message: "Invalid ObjectID format",
        input: value,
      });

      return z.NEVER;
    }
  }),
  creationDate: z.iso.datetime().transform((str) => new Date(str)),
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
