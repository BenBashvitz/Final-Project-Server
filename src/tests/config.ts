import z from "zod";

const testConfig = z
  .object({
    MONGODB_URL: z.string(),
    JWT_SECRET: z.string(),
    JWT_EXPIRATION_TIME_SECONDS: z.string().regex(/^\d+$/).transform(Number),
    REFRESH_JWT_EXPIRATION_TIME_SECONDS: z
      .string()
      .regex(/^\d+$/)
      .transform(Number),
    POSTS_PAGE_SIZE: z
      .string()
      .regex(/^\d+$/)
      .transform(Number)
      .refine((value) => value > 0, {
        message: "POSTS_PAGE_SIZE must be a positive number",
      }),
  })
  .parse(process.env);

export default testConfig;
