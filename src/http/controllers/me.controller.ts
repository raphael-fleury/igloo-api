import z from "zod";
import Elysia from "elysia";
import { updateUserDto, userDto } from "@/app/dtos/user.dtos";
import { updateProfileDto } from "@/app/dtos/profile.dtos";
import { UnauthorizedError } from "@/app/errors";
import { UpdateUserHandler } from "@/app/handlers/user/update-user.handler";
import { UpdateProfileHandler } from "@/app/handlers/profile/update-profile.handler";
import { GetBlockedProfilesHandler } from "@/app/handlers/block/get-blocked-profiles.handler";
import { GetFollowersHandler } from "@/app/handlers/follow/get-followers.handler";
import { GetFollowingHandler } from "@/app/handlers/follow/get-following.handler";
import { GetMutedProfilesHandler } from "@/app/handlers/mute/get-muted-profiles.handler";
import { onErrorMiddleware } from "../middlewares/on-error.middleware";
import { authMiddleware } from "../middlewares/auth.middleware";

export const meController = (
    updateUserHandler = UpdateUserHandler.default,
    updateProfileHandler = UpdateProfileHandler.default,
    getBlockedProfilesHandler = GetBlockedProfilesHandler.default,
    getFollowersHandler = GetFollowersHandler.default,
    getFollowingHandler = GetFollowingHandler.default,
    getMutedProfilesHandler = GetMutedProfilesHandler.default,
) => new Elysia({ prefix: "/me" })
    .use(onErrorMiddleware)
    .use(authMiddleware)
    .guard({
        detail: { tags: ['Me'] }
    })

    .patch('/', async ({ user, body }) => {
        return await updateUserHandler.handle(user.id, body);
    }, {
        detail: { summary: "Update current user" },
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
    })

    .onBeforeHandle(async ({ profile }) => {
        if (!profile)
            throw new UnauthorizedError("You must be logged in a profile to do this action");
    })
    .derive(({ profile }) => {
        return { profile: profile! }
    })

    .get('/profile', async ({ profile }) => {
        return profile;
    }, {
        detail: { summary: "Get current profile" }
    })

    .patch('/profile', async ({ profile, body }) => {
        return await updateProfileHandler.handle(profile.id, body);
    }, {
        detail: { summary: "Update current profile" },
        body: updateProfileDto
    })

    .get('/profile/blocks', async ({ profile }) => {
        return await getBlockedProfilesHandler.handle(profile.id);
    }, {
        detail: { summary: "Get all profiles blocked by current profile" }
    })

    .get('/profile/followers', async ({ profile }) => {
        return await getFollowersHandler.handle(profile.id);
    }, {
        detail: { summary: "Get all followers of current profile" }
    })

    .get('/profile/following', async ({ profile }) => {
        return await getFollowingHandler.handle(profile.id);
    }, {
        detail: { summary: "Get all profiles that current profile is following" }
    })

    .get('/profile/mutes', async ({ profile }) => {
        return await getMutedProfilesHandler.handle(profile.id);
    }, {
        detail: { summary: "Get all profiles muted by current profile" }
    });
