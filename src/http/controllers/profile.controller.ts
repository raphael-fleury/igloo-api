import z from "zod";
import Elysia from "elysia";
import { UnauthorizedError } from "@/app/errors";
import { GetProfileByIdHandler } from "@/app/handlers/profile/get-profile-by-id.handler";
import { GetFollowersHandler } from "@/app/handlers/follow/get-followers.handler";
import { GetFollowingHandler } from "@/app/handlers/follow/get-following.handler";
import { BlockProfileHandler } from "@/app/handlers/block/block-profile.handler";
import { UnblockProfileHandler } from "@/app/handlers/block/unblock-profile.handler";
import { MuteProfileHandler } from "@/app/handlers/mute/mute-profile.handler";
import { UnmuteProfileHandler } from "@/app/handlers/mute/unmute-profile.handler";
import { FollowProfileHandler } from "@/app/handlers/follow/follow-profile.handler";
import { UnfollowProfileHandler } from "@/app/handlers/follow/unfollow-profile.handler";
import { onErrorMiddleware } from "../middlewares/on-error.middleware";
import { authMiddleware } from "../middlewares/auth.middleware";

const profileIdParam = z.object({
    id: z.uuid()
});

export const profileController = (
    getProfileByIdHandler = GetProfileByIdHandler.default,
    getFollowersHandler = GetFollowersHandler.default,
    getFollowingHandler = GetFollowingHandler.default,
    blockProfileHandler = BlockProfileHandler.default,
    unblockProfileHandler = UnblockProfileHandler.default,
    muteProfileHandler = MuteProfileHandler.default,
    unmuteProfileHandler = UnmuteProfileHandler.default,
    followProfileHandler = FollowProfileHandler.default,
    unfollowProfileHandler = UnfollowProfileHandler.default,
) => new Elysia({ prefix: "/profiles" })
    .use(onErrorMiddleware)
    .guard({
        detail: { tags: ['Profiles'] }
    })

    .get('/:id', async ({ params }) => {
        return await getProfileByIdHandler.handle(params.id);
    }, {
        detail: { summary: "Get profile by ID (public)" },
        params: profileIdParam
    })

    .group('/:id', (app) => app
        .use(authMiddleware)
        .onBeforeHandle(async ({ profile }) => {
            if (!profile)
                throw new UnauthorizedError("You must be logged in a profile to do this action");
        })
        .get('/followers', async ({ params }) => {
            return await getFollowersHandler.handle(params.id);
        }, {
            detail: { summary: "Get followers of a profile" },
            params: profileIdParam
        })

        .get('/following', async ({ params }) => {
            return await getFollowingHandler.handle(params.id);
        }, {
            detail: { summary: "Get all profiles followed by this one" },
            params: profileIdParam
        })

        .post('/block', async ({ profile, params, status }) => {
            await blockProfileHandler.handle(profile!.id, params.id);
            return status("No Content");
        }, {
            detail: { summary: "Block a profile" },
            params: profileIdParam
        })

        .delete('/block', async ({ profile, params, status }) => {
            await unblockProfileHandler.handle(profile!.id, params.id);
            return status("No Content");
        }, {
            detail: { summary: "Unblock a profile" },
            params: profileIdParam
        })

        .post('/mute', async ({ profile, params, status }) => {
            await muteProfileHandler.handle(profile!.id, params.id);
            return status("No Content");
        }, {
            detail: { summary: "Mute a profile" },
            params: profileIdParam
        })

        .delete('/mute', async ({ profile, params, status }) => {
            await unmuteProfileHandler.handle(profile!.id, params.id);
            return status("No Content");
        }, {
            detail: { summary: "Unmute a profile" },
            params: profileIdParam
        })

        .post('/follow', async ({ profile, params, status }) => {
            await followProfileHandler.handle(profile!.id, params.id);
            return status("No Content");
        }, {
            detail: { summary: "Follow a profile" },
            params: profileIdParam
        })

        .delete('/follow', async ({ profile, params, status }) => {
            await unfollowProfileHandler.handle(profile!.id, params.id);
            return status("No Content");
        }, {
            detail: { summary: "Unfollow a profile" },
            params: profileIdParam
        })
    );
