import z from "zod";
import Elysia from "elysia";
import { appDataSource } from "@/database/data-source";
import { User } from "@/database/entities/user";
import { createUserDto, updateUserDto } from "@/app/dtos/user.dtos";
import { GetUsersHandler } from "@/app/handlers/user/get-users.handler";
import { GetUserByIdHandler } from "@/app/handlers/user/get-user-by-id.handler";
import { CreateUserHandler } from "@/app/handlers/user/create-user.handler";
import { UpdateUserHandler } from "@/app/handlers/user/update-user.handler";

export const userController = new Elysia({ prefix: "/users" })
    .decorate("dataSource", appDataSource)
    .decorate("repository", appDataSource.getRepository(User))

    .get('/', async ({ repository }) => {
        const handler = new GetUsersHandler(repository);
        return await handler.handle();
    }, {
        detail: {
            tags: ['Users'],
            summary: "Get all users"
        }
    })

    .get('/:id', async ({ repository, params }) => {
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

    .post('/', async ({ dataSource, body, set }) => {
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
    
    .patch('/:id', async ({ repository, params, body }) => {
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