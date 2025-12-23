import z from "zod";
import Elysia, { status } from "elysia";
import { createUserDto, userDto } from "@/app/dtos/user.dtos";
import { CreateUserHandler } from "@/app/handlers/user/create-user.handler";
import { onErrorMiddleware } from "../middlewares/on-error.middleware";

export const authController = (
    createUserHandler = CreateUserHandler.default,
) => new Elysia({ prefix: "/auth" })
    .use(onErrorMiddleware)
    .guard({
        detail: { tags: ['Auth'] }
    })

    .post('/register', async ({ body, set }) => {
        const userWithProfile = await createUserHandler.handle(body);
        return status(201, userWithProfile);
    }, {
        detail: { summary: "Register a new user" },
        body: createUserDto,
        response: {
            201: userDto,
            422: z.object({
                message: z.string()
            })
        }
    });

