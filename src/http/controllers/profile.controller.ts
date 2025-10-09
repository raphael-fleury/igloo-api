import z from "zod";
import Elysia from "elysia";
import { appDataSource } from "@/database/data-source";
import { Profile } from "@/database/entities/profile";
import { updateProfileDto } from "@/app/dtos/profile.dtos";
import { GetProfilesHandler } from "@/app/handlers/profile/get-profiles.handler";
import { GetProfileByIdHandler } from "@/app/handlers/profile/get-profile-by-id.handler";
import { UpdateProfileHandler } from "@/app/handlers/profile/update-profile.handler";
import { onErrorMiddleware } from "../middlewares/on-error.middleware";

export const createProfileControllerHandlers = (dataSource = appDataSource) => ({
    getProfilesHandler: () => new GetProfilesHandler(dataSource.getRepository(Profile)),
    getProfileByIdHandler: () => new GetProfileByIdHandler(dataSource.getRepository(Profile)),
    updateProfileHandler: () => new UpdateProfileHandler(dataSource.getRepository(Profile)),
});

export const profileController = new Elysia({ prefix: "/profiles" })
    .decorate("handlers", createProfileControllerHandlers())
    .use(onErrorMiddleware)

    .get('/', async ({ handlers }) => {
        const handler = handlers.getProfilesHandler();
        return await handler.handle();
    }, {
        detail: {
            tags: ['Profiles'],
            summary: "Get all profiles"
        }
    })

    .get('/:id', async ({ handlers, params }) => {
        const handler = handlers.getProfileByIdHandler();
        return await handler.handle(params.id);
    }, {
        params: z.object({
            id: z.uuid()
        }),
        detail: {
            tags: ['Profiles'],
            summary: "Get profile by ID"
        }
    })

    .patch('/:id', async ({ handlers, params, body }) => {
        const handler = handlers.updateProfileHandler();
        return await handler.handle(params.id, body);
    }, {
        params: z.object({
            id: z.uuid()
        }),
        body: updateProfileDto,
        detail: {
            tags: ['Profiles'],
            summary: "Update profile by ID"
        }
    });