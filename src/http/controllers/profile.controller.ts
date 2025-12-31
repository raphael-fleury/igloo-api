import z from "zod";
import Elysia from "elysia";
import { GetProfileByIdHandler } from "@/app/handlers/profile/get-profile-by-id.handler";
import { GetFollowersHandler } from "@/app/handlers/follow/get-followers.handler";
import { GetFollowingHandler } from "@/app/handlers/follow/get-following.handler";
import { BlockProfileHandler } from "@/app/handlers/block/block-profile.handler";
import { UnblockProfileHandler } from "@/app/handlers/block/unblock-profile.handler";
import { MuteProfileHandler } from "@/app/handlers/mute/mute-profile.handler";
import { UnmuteProfileHandler } from "@/app/handlers/mute/unmute-profile.handler";
import { FollowProfileHandler } from "@/app/handlers/follow/follow-profile.handler";
import { UnfollowProfileHandler } from "@/app/handlers/follow/unfollow-profile.handler";
import { requireProfileMiddleware } from "../middlewares/require-profile.middleware";
import { onErrorMiddleware } from "../middlewares/on-error.middleware";

const profileIdParam = z.object({
    id: z.uuid()
});

const getDefaultProps = () => ({
    handlers: {
        getProfileById: GetProfileByIdHandler.default,
        getFollowers: GetFollowersHandler.default,
        getFollowing: GetFollowingHandler.default,
        blockProfile: BlockProfileHandler.default,
        unblockProfile: UnblockProfileHandler.default,
        muteProfile: MuteProfileHandler.default,
        unmuteProfile: UnmuteProfileHandler.default,
        followProfile: FollowProfileHandler.default,
        unfollowProfile: UnfollowProfileHandler.default,
    }
})

export const profileController = ({ handlers } = getDefaultProps()) =>
    new Elysia({ prefix: "/profiles" })
    .use(onErrorMiddleware)
    .guard({
        detail: { tags: ['Profiles'] }
    })

    .get('/:id', async ({ params }) => {
        return await handlers.getProfileById.handle(params.id);
    }, {
        detail: { summary: "Get profile by ID (public)" },
        params: profileIdParam
    })

    .group('/:id', (app) => app
        .use(requireProfileMiddleware)
        .get('/followers', async ({ params }) => {
            return await handlers.getFollowers.handle(params.id);
        }, {
            detail: { summary: "Get followers of a profile" },
            params: profileIdParam
        })

        .get('/following', async ({ params }) => {
            return await handlers.getFollowing.handle(params.id);
        }, {
            detail: { summary: "Get all profiles followed by this one" },
            params: profileIdParam
        })

        .post('/block', async ({ profile, params, status }) => {
            await handlers.blockProfile.handle(profile.id, params.id);
            return status("No Content");
        }, {
            detail: { summary: "Block a profile" },
            params: profileIdParam
        })

        .delete('/block', async ({ profile, params, status }) => {
            await handlers.unblockProfile.handle(profile.id, params.id);
            return status("No Content");
        }, {
            detail: { summary: "Unblock a profile" },
            params: profileIdParam
        })

        .post('/mute', async ({ profile, params, status }) => {
            await handlers.muteProfile.handle(profile.id, params.id);
            return status("No Content");
        }, {
            detail: { summary: "Mute a profile" },
            params: profileIdParam
        })

        .delete('/mute', async ({ profile, params, status }) => {
            await handlers.unmuteProfile.handle(profile.id, params.id);
            return status("No Content");
        }, {
            detail: { summary: "Unmute a profile" },
            params: profileIdParam
        })

        .post('/follow', async ({ profile, params, status }) => {
            await handlers.followProfile.handle(profile.id, params.id);
            return status("No Content");
        }, {
            detail: { summary: "Follow a profile" },
            params: profileIdParam
        })

        .delete('/follow', async ({ profile, params, status }) => {
            await handlers.unfollowProfile.handle(profile.id, params.id);
            return status("No Content");
        }, {
            detail: { summary: "Unfollow a profile" },
            params: profileIdParam
        })
    );
