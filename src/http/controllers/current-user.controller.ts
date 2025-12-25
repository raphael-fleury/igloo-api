import z from "zod";
import Elysia from "elysia";
import { updateUserDto, userDto } from "@/app/dtos/user.dtos";
import { UpdateUserHandler } from "@/app/handlers/user/update-user.handler";
import { onErrorMiddleware } from "../middlewares/on-error.middleware";
import { authMiddleware } from "../middlewares/auth.middleware";

export const currentUserController = (
    updateUserHandler = UpdateUserHandler.default,
) => new Elysia({ prefix: "/me" })
    .use(onErrorMiddleware)
    .use(authMiddleware)
    .guard({
        detail: { tags: ['Current User'] }
    })

    .patch('/', async ({ user, body }) => {
        return await updateUserHandler.handle(user.id, body);
    }, {
        detail: { summary: "Update current user" },
        body: updateUserDto,
        response: {
            200: userDto,
            404: z.object({
                message: z.string()
            }),
            422: z.object({
                message: z.string()
            })
        }
    })