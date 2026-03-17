import z from "zod";
import {refreshTokenCookieName} from "../consts";

export const LoginSchema = z.object({
    username: z.string(),
    password: z.string(),
});

export const RegisterSchema = z.object({
    ...LoginSchema.shape,
    email: z.email(),
});

export const RefreshTokenSchema = z.object({
    [refreshTokenCookieName]: z.jwt(),
})