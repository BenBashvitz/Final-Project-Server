import z from 'zod'

export const envSchema = z.object({
    PORT: z.number().default(3000),
    SERVER_URL: z.url(),
    CLIENT_URL: z.url(),
    MONGODB_URL: z.string().trim().min(1),
    JWT_SECRET: z.string().trim().min(1),
    JWT_EXPIRATION_TIME_SECONDS: z.number().default(3600),
    REFRESH_JWT_EXPIRATION_TIME_SECONDS: z.number().default(86400),
});

const parsedEnv = envSchema.safeParse(process.env);

if(!parsedEnv.success) {
    console.error(parsedEnv.error.issues);
    process.exit(1);
}

const env = parsedEnv.data;

export default env;