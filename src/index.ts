import { Elysia } from "elysia";
import { openapi } from "@elysiajs/openapi";
import { userController } from "./controllers/user.controller";
import { profileController } from "./controllers/profile.controller";

const app = new Elysia()
  .use(openapi())
  .use(userController)
  .use(profileController)
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
