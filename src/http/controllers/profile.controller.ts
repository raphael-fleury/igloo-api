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
    .guard({
        detail: { tags: ['Profiles'] }
    })

    .get('/', async () => {
        return await getProfilesHandler.handle();
    }, {
        detail: { summary: "Get all profiles" }
    })

    .get('/:id', async ({ params }) => {
        return await getProfileByIdHandler.handle(params.id);
    }, {
        detail: { summary: "Get profile by ID" },
        params: z.object({
            id: z.uuid()
        }),
    })

    .patch('/:id', async ({ params, body }) => {
        return await updateProfileHandler.handle(params.id, body);
    }, {
        detail: { summary: "Update profile by ID" },
        params: z.object({
            id: z.uuid()
        }),
        body: updateProfileDto
    });