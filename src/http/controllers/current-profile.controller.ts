import Elysia from "elysia";
import { updateProfileDto } from "@/app/dtos/profile.dtos";
import { UpdateProfileHandler } from "@/app/handlers/profile/update-profile.handler";
import { GetBlockedProfilesHandler } from "@/app/handlers/block/get-blocked-profiles.handler";
import { GetFollowersHandler } from "@/app/handlers/follow/get-followers.handler";
import { GetFollowingHandler } from "@/app/handlers/follow/get-following.handler";
import { GetMutedProfilesHandler } from "@/app/handlers/mute/get-muted-profiles.handler";
import { onErrorMiddleware } from "../middlewares/on-error.middleware";
import { requireProfileMiddleware } from "../middlewares/require-profile.middleware";

export const currentProfileController = (
    updateProfileHandler = UpdateProfileHandler.default,
    getBlockedProfilesHandler = GetBlockedProfilesHandler.default,
    getFollowersHandler = GetFollowersHandler.default,
    getFollowingHandler = GetFollowingHandler.default,
    getMutedProfilesHandler = GetMutedProfilesHandler.default,
) => new Elysia({ prefix: "/me/profile" })
    .use(onErrorMiddleware)
    .use(requireProfileMiddleware)
    .guard({
        detail: { tags: ['Current Profile'] }
    })

    .get('/', async ({ profile }) => {
        return profile;
    }, {
        detail: { summary: "Get current profile" }
    })

    .patch('/', async ({ profile, body }) => {
        return await updateProfileHandler.handle(profile.id, body);
    }, {
        detail: { summary: "Update current profile" },
        body: updateProfileDto
    })

    .get('/blocks', async ({ profile }) => {
        return await getBlockedProfilesHandler.handle(profile.id);
    }, {
        detail: { summary: "Get all profiles blocked by current profile" }
    })

    .get('/followers', async ({ profile }) => {
        return await getFollowersHandler.handle(profile.id);
    }, {
        detail: { summary: "Get all followers of current profile" }
    })

    .get('/following', async ({ profile }) => {
        return await getFollowingHandler.handle(profile.id);
    }, {
        detail: { summary: "Get all profiles that current profile is following" }
    })

    .get('/mutes', async ({ profile }) => {
        return await getMutedProfilesHandler.handle(profile.id);
    }, {
        detail: { summary: "Get all profiles muted by current profile" }
    });
