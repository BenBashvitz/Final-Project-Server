import z from "zod";

export const DeleteOldImgSchema = z.object({
  oldImgUrl: z.string(),
});
