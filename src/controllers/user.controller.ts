import Elysia from "elysia";
import { appDataSource } from "../database/data-source";
import { User } from "../database/entities/user";

export const userController = new Elysia({ prefix: "/users" })
    .decorate("repository", appDataSource.getRepository(User))
    .get('/', async ({repository}) => {
        return await repository.find();
    })
    .post('/', async ({repository, body, set}) => {
        set.status = 201
        return await repository.save(body as any);
    });