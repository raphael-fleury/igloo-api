import z from "zod";
import { Elysia } from "elysia";
import { openapi } from "@elysiajs/openapi";
import { authController } from "@/http/controllers/auth.controller";
import { meController } from "@/http/controllers/me.controller";
import { profileController } from "@/http/controllers/profile.controller";
import { postController } from "@/http/controllers/post.controller";

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
