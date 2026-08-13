import z from "zod";
import Elysia from "elysia";
import { updateUserDto, userDto } from "@/app/dtos/user.dtos";
import { onErrorMiddleware } from "../middlewares/on-error.middleware";
import { authMiddleware } from "../middlewares/auth.middleware";
import { CommandBus } from "@/app/cqrs/command-bus";

const getDefaultProps = () => ({
    bus: CommandBus.default
})

export const currentUserController = ({ bus } = getDefaultProps()) =>
    new Elysia({ prefix: "/me" })
    .use(onErrorMiddleware)
    .use(authMiddleware)
    .guard({
        detail: { tags: ['Current User'] }
    })
    .model({
        User: userDto
    })

    .get('/', async ({ user }) => {
        return user;
    }, {
        detail: {
            operationId: "getCurrentUser",
            summary: "Get current user"
        },
        response: {
            200: 'User',
            401: 'UnauthorizedError'
        }
    })

    .patch('/', async ({ user, body }) => {
        return await bus.execute("updateUser", { id: user.id, data: body });
    }, {
        detail: {
            operationId: "updateCurrentUser",
            summary: "Update current user"
        },
        body: updateUserDto,
        response: {
            200: 'User',
            401: 'UnauthorizedError',
            404: 'NotFoundError',
            422: 'UnprocessableEntity'
        }
    })