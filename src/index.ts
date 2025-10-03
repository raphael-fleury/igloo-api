import { Elysia } from "elysia";
import { openapi } from "@elysiajs/openapi";
import { appDataSource } from "./database/data-source";
import { User } from "./database/entities/user";

const app = new Elysia()
  .use(openapi())
  .get("/", () => "Hello Elysia")
  .get("/users", async () => {
    const userRepository = appDataSource.getRepository(User);
    return await userRepository.find();
  })
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
