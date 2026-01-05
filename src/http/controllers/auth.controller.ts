import z from "zod";
import Elysia, { status } from "elysia";
import { loginDto } from "@/app/dtos/auth.dtos";
import { createUserDto } from "@/app/dtos/user.dtos";
import { onErrorMiddleware } from "../middlewares/on-error.middleware";
import { jwtMiddleware } from "../middlewares/jwt.middleware";
import { CommandBus } from "@/app/cqrs/command-bus";

const getDefaultProps = () => ({
    bus: CommandBus.default
})

export const authController = ({ bus } = getDefaultProps()) =>
    new Elysia({ prefix: "/auth" })
    .use(onErrorMiddleware)
    .use(jwtMiddleware)
    .guard({
        detail: { tags: ['Auth'] },
        security: []
    })

    .post('/register', async ({ body, jwt }) => {
        const userWithProfile = await bus.execute("createUser", body);

        const token = await jwt.sign({
            userId: userWithProfile.id,
            profileId: userWithProfile.profile.id
        })

        return status(201, { token });
    }, {
        detail: { summary: "Register a new user 🌍" },
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
        const { userId, profileId } = await bus.execute("login", body);
        const token = await jwt.sign({ userId, profileId });
        return { token };
    }, {
        detail: { summary: "Login 🌍" },
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

