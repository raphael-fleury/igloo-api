import { z } from 'zod';

const envSchema = z.object({
    JWT_SECRET: z.string().nonempty(),
    POSTGRES_HOST: z.string().nonempty().default('localhost'),
    POSTGRES_PORT: z.coerce.number().min(1).default(5435),
    POSTGRES_DB: z.string().nonempty().default('igloo_db'),
    POSTGRES_USER: z.string().nonempty().default('postgres'),
    POSTGRES_PASSWORD: z.string().nonempty().default('12345678'),
});

export const env = envSchema.parse(process.env);
