import z from "zod";

export const UserUpdateSchema = z.object({
    username: z.string(),
    imgUrl: z.string(),
})