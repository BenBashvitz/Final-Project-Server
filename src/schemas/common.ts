import z from "zod";
import mongoose from "mongoose";

export const IdSchema = z.string().transform((value, ctx) => {
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
});

export const IdParamSchema = z.object({
  id: IdSchema,
});

export const CreationDateSchema = z.iso
  .datetime()
  .transform((str) => new Date(str));

export const PostIdParamSchema = z.object({
  postId: IdSchema,
});
