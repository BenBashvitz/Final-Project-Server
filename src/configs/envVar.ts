import dotenv from "dotenv";
import z from "zod";

dotenv.config({path: ".env.dev"});

const config = z
    .object({
        PORT: z.string(),
        MONGODB_URL: z.string(),
        JWT_SECRET: z.string(),
        JWT_EXPIRATION_TIME_SECONDS: z.string().regex(/^\d+$/).transform(Number),
        REFRESH_JWT_EXPIRATION_TIME_SECONDS: z
            .string()
            .regex(/^\d+$/)
            .transform(Number),
        CLIENT_URL: z.string(),
        SERVER_URL: z.string(),
        POSTS_PAGE_SIZE: z
            .string()
            .regex(/^\d+$/)
            .transform(Number)
            .refine((value) => value > 0, {
                message: "POSTS_PAGE_SIZE must be a positive number",
            }),
        GOOGLE_CLIENT_ID: z.string(),
        RAG_CHUNK_SIZE: z
            .string()
            .regex(/^\d+$/)
            .transform(Number),
        RAG_CHUNK_OVERLAP: z
            .string()
            .regex(/^\d+$/)
            .transform(Number),
    })
    .parse(process.env);

export default config;
