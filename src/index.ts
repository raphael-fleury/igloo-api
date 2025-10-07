import z from "zod";
import { Elysia } from "elysia";
import { openapi } from "@elysiajs/openapi";
import { userController } from "@/http/controllers/user.controller";
import { profileController } from "@/http/controllers/profile.controller";
import { AlreadyExistsError, NotFoundError } from "./app/errors";

const app = new Elysia()
  .use(openapi({
    mapJsonSchema: {
      zod: z.toJSONSchema
    }
  }))
  .error({ AlreadyExistsError, NotFoundError })
  .onError(({ code, error, set }) => {
    switch (code) {
      case 'AlreadyExistsError':
        set.status = 409;
        break;
      case 'NOT_FOUND':
      case 'NotFoundError':
        set.status = 404;
        break;
      case 'PARSE':
      case 'VALIDATION':
        set.status = 422;
        set.headers["content-type"] = "application/json";
        return error.message;
      case 'INVALID_COOKIE_SIGNATURE':
      case 'INVALID_FILE_TYPE':
        set.status = 400;
        break;
      case 'UNKNOWN':
      case 'INTERNAL_SERVER_ERROR':
        set.status = 500;
        break;
      default:
        set.status = 500;
        return { message: 'Internal Server Error' }
    }

    const { message } = error;
    return { message };
  })
  .use(userController)
  .use(profileController)
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
