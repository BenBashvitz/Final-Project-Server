import z from "zod";

export const RegisterSchema = z.object({
    username: z.string(),
    password: z.string(),
    email: z.email(),
});

export const LoginSchema = z.object({
    username: z.string(),
    password: z.string(),
});