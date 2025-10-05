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
    })
    .get('/:id', async ({ repository, params, set }) => {
        const handler = new GetUserByIdHandler(repository);
        const user = await handler.handle(params.id);

        if (!user) {
            set.status = 404;
            return { error: 'User not found' };
        }

        return user;
    })
    .post('/', async ({ dataSource, body, set }) => {
        const handler = new CreateUserHandler(dataSource);
        const userWithProfile = await handler.handle(body);
        
        if (!userWithProfile) {
            set.status = 500;
            return { error: 'Error creating user' };
        }

        set.status = 201;
        return userWithProfile;
    }, {
        body: createUserDto
    })
    .patch('/:id', async ({ repository, params, body, set }) => {
        const handler = new UpdateUserHandler(repository);
        const user = await handler.handle(params.id, body);

        if (!user) {
            set.status = 404;
            return 'User not found'
        }
        if ('error' in user) {
            set.status = 409;
            return user.error;
        }
    }, {
        body: updateUserDto
    });