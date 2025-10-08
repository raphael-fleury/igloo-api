import z from "zod";
import { Elysia } from "elysia";
import { openapi } from "@elysiajs/openapi";
import { userController } from "@/http/controllers/user.controller";
import { profileController } from "@/http/controllers/profile.controller";
import { onErrorMiddleware } from "./http/middlewares/on-error.middleware";

const app = new Elysia()
  .use(openapi({
    mapJsonSchema: {
      zod: z.toJSONSchema
    }
  }))
  .use(onErrorMiddleware)
  .use(userController)
  .use(profileController)
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
