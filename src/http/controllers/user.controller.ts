import z from "zod";
import Elysia, { status } from "elysia";
import { createUserDto, updateUserDto, userDto } from "@/app/dtos/user.dtos";
import { GetUsersHandler } from "@/app/handlers/user/get-users.handler";
import { GetUserByIdHandler } from "@/app/handlers/user/get-user-by-id.handler";
import { CreateUserHandler } from "@/app/handlers/user/create-user.handler";
import { UpdateUserHandler } from "@/app/handlers/user/update-user.handler";
import { onErrorMiddleware } from "../middlewares/on-error.middleware";

export const userController = (
    createUserHandler = CreateUserHandler.default,
    getUsersHandler = GetUsersHandler.default,
    getUserByIdHandler = GetUserByIdHandler.default,
    updateUserHandler = UpdateUserHandler.default,
) => new Elysia({ prefix: "/users" })
    .use(onErrorMiddleware)
    .guard({
        detail: { tags: ['Users'] }
    })

    .get('/', async () => {
        return await getUsersHandler.handle();
    }, {
        detail: { summary: "Get all users" },
        response: {
            200: z.array(userDto)
        }
    })

    .get('/:id', async ({ params }) => {
        return await getUserByIdHandler.handle(params.id);
    }, {
        detail: { summary: "Get user by ID" },
        params: z.object({
            id: z.uuid()
        }),
        response: {
            200: userDto,
            404: z.object({
                message: z.string()
            })
        }
    })

    .post('/', async ({ body, set }) => {
        const userWithProfile = await createUserHandler.handle(body);
        return status(201, userWithProfile);
    }, {
        detail: { summary: "Create a new user" },
        body: createUserDto,
        response: {
            201: userDto,
            422: z.object({
                message: z.string()
            })
        }
    })
    
    .patch('/:id', async ({ params, body }) => {
        return await updateUserHandler.handle(params.id, body);
    }, {
        detail: { summary: "Update user by ID" },
        params: z.object({
            id: z.uuid()
        }),
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
    });