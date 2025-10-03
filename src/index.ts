import { Elysia } from "elysia";
import { openapi } from "@elysiajs/openapi";
import { userController } from "./controllers/user.controller";

const app = new Elysia()
  .use(openapi())
  .get("/", () => "Hello Elysia")
  .use(userController)
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
