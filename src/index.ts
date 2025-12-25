import z from "zod";
import { Elysia } from "elysia";
import { openapi } from "@elysiajs/openapi";
import { appDataSource } from "./database/data-source";
import { authController } from "@/http/controllers/auth.controller";
import { profileController } from "@/http/controllers/profile.controller";
import { postController } from "@/http/controllers/post.controller";
import { currentUserController } from "./http/controllers/current-user.controller";
import { currentProfileController } from "./http/controllers/current-profile.controller";

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
    .use(currentUserController())
    .use(currentProfileController())
    .use(profileController())
    .use(postController())
    .listen(3000);

console.log(
    `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
