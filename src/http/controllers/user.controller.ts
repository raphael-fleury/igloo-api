import z from "zod";
import Elysia, { status } from "elysia";
import { appDataSource } from "@/database/data-source";
import { User } from "@/database/entities/user";
import { createUserDto, updateUserDto } from "@/app/dtos/user.dtos";
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

    .get('/', async () => {
        return await getUsersHandler.handle();
    }, {
        detail: {
            tags: ['Users'],
            summary: "Get all users"
        }
    })

    .get('/:id', async ({ params }) => {
        return await getUserByIdHandler.handle(params.id);
    }, {
        params: z.object({
            id: z.uuid()
        }),
        detail: {
            tags: ['Users'],
            summary: "Get user by ID"
        }
    })

    .post('/', async ({ body, set }) => {
        const userWithProfile = await createUserHandler.handle(body);
        return status(201, userWithProfile);
    }, {
        body: createUserDto,
        detail: {
            tags: ['Users'],
            summary: "Create a new user"
        }
    })
    
    .patch('/:id', async ({ params, body }) => {
        return await updateUserHandler.handle(params.id, body);
    }, {
        params: z.object({
            id: z.uuid()
        }),
        body: updateUserDto,
        detail: {
            tags: ['Users'],
            summary: "Update user by ID"
        }
    });