import z from "zod";
import Elysia, { status } from "elysia";
import { createUserDto } from "@/app/dtos/user.dtos";
import { CreateUserHandler } from "@/app/handlers/user/create-user.handler";
import { onErrorMiddleware } from "../middlewares/on-error.middleware";
import { jwtMiddleware } from "../middlewares/jwt.middleware";
import { LoginHandler } from "@/app/handlers/auth/login.handler";
import { loginDto } from "@/app/dtos/auth.dtos";

export const authController = (
    createUserHandler = CreateUserHandler.default,
    loginHandler = LoginHandler.default
) => new Elysia({ prefix: "/auth" })
    .use(onErrorMiddleware)
    .use(jwtMiddleware)
    .guard({
        detail: { tags: ['Auth'] }
    })

    .post('/register', async ({ body, jwt }) => {
        const userWithProfile = await createUserHandler.handle(body);

        const token = await jwt.sign({
            userId: userWithProfile.id,
            profileId: userWithProfile.profile.id
        })

        return status(201, { token });
    }, {
        detail: { summary: "Register a new user" },
        body: createUserDto,
        response: {
            201: z.object({
                token: z.string()
            }),
            422: z.object({
                message: z.string()
            })
        }
    })

    .post('/login', async ({ body, jwt }) => {
        const user = await loginHandler.handle(body);

        const token = await jwt.sign({
            userId: user.id
        })

        return { token };
    }, {
        detail: { summary: "Login" },
        body: loginDto,
        response: {
            200: z.object({
                token: z.string()
            }),
            422: z.object({
                message: z.string()
            })
        }
    })

