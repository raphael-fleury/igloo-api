import z from "zod";
import Elysia from "elysia";
import { appDataSource } from "@/database/data-source";
import { User } from "@/database/entities/user";
import { createUserDto, updateUserDto } from "@/app/dtos/user.dtos";
import { GetUsersHandler } from "@/app/handlers/user/get-users.handler";
import { GetUserByIdHandler } from "@/app/handlers/user/get-user-by-id.handler";
import { CreateUserHandler } from "@/app/handlers/user/create-user.handler";
import { UpdateUserHandler } from "@/app/handlers/user/update-user.handler";
import { onErrorMiddleware } from "../middlewares/on-error.middleware";

export const userController = (
    dataSource = appDataSource,
    repository = appDataSource.getRepository(User)
) => new Elysia({ prefix: "/users" })
    .use(onErrorMiddleware)

    .get('/', async () => {
        const handler = new GetUsersHandler(repository);
        return await handler.handle();
    }, {
        detail: {
            tags: ['Users'],
            summary: "Get all users"
        }
    })

    .get('/:id', async ({ params }) => {
        const handler = new GetUserByIdHandler(repository);
        return await handler.handle(params.id);
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
        const handler = new CreateUserHandler(dataSource);
        const userWithProfile = await handler.handle(body);

        set.status = 201;
        return userWithProfile;
    }, {
        body: createUserDto,
        detail: {
            tags: ['Users'],
            summary: "Create a new user"
        }
    })
    
    .patch('/:id', async ({ params, body }) => {
        const handler = new UpdateUserHandler(repository);
        return await handler.handle(params.id, body);
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