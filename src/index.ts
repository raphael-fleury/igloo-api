import z from "zod";
import { Elysia } from "elysia";
import { openapi } from "@elysiajs/openapi";
import { userController } from "@/http/controllers/user.controller";
import { profileController } from "@/http/controllers/profile.controller";
import { blockController } from "@/http/controllers/block.controller";
import { repostController } from "@/http/controllers/repost.controller";
import { meController } from "./http/controllers/me.controller";

const app = new Elysia()
  .use(openapi({
    mapJsonSchema: {
      zod: z.toJSONSchema
    }
  }))
  .use(meController())
  .use(userController())
  .use(profileController())
  .use(blockController())
  .use(repostController())
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
