import mongoose from "mongoose";
import z from "zod";

export const UserIdSchema = z.string().transform((value, ctx) => {
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