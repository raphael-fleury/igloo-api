import z from "zod";
import { Elysia } from "elysia";
import { openapi } from "@elysiajs/openapi";
import { authController } from "@/http/controllers/auth.controller";
import { meController } from "@/http/controllers/me.controller";
import { profileController } from "@/http/controllers/profile.controller";
import { postController } from "@/http/controllers/post.controller";
import { appDataSource } from "./database/data-source";

try {
    await appDataSource.initialize();
    console.log("✅ Database connected successfully");
} catch (error) {
    console.error("❌ Database connection failed:", error);
}

const app = new Elysia()
    .use(openapi({
        mapJsonSchema: {
            zod: z.toJSONSchema
        }
    }))
    .use(authController())
    .use(meController())
    .use(profileController())
    .use(postController())
    .listen(3000);

console.log(
    `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
