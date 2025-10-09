import z from "zod";
import Elysia from "elysia";
import { updateProfileDto } from "@/app/dtos/profile.dtos";
import { GetProfilesHandler } from "@/app/handlers/profile/get-profiles.handler";
import { GetProfileByIdHandler } from "@/app/handlers/profile/get-profile-by-id.handler";
import { UpdateProfileHandler } from "@/app/handlers/profile/update-profile.handler";
import { onErrorMiddleware } from "../middlewares/on-error.middleware";

export const profileController = (
    getProfilesHandler = GetProfilesHandler.default,
    getProfileByIdHandler = GetProfileByIdHandler.default,
    updateProfileHandler = UpdateProfileHandler.default,
) => new Elysia({ prefix: "/profiles" })
    .use(onErrorMiddleware)

    .get('/', async () => {
        return await getProfilesHandler.handle();
    }, {
        detail: {
            tags: ['Profiles'],
            summary: "Get all profiles"
        }
    })

    .get('/:id', async ({ params }) => {
        return await getProfileByIdHandler.handle(params.id);
    }, {
        params: z.object({
            id: z.uuid()
        }),
        detail: {
            tags: ['Profiles'],
            summary: "Get profile by ID"
        }
    })

    .patch('/:id', async ({ params, body }) => {
        return await updateProfileHandler.handle(params.id, body);
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