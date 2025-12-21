import Elysia from "elysia";
import z from "zod";
import { followDto } from "@/app/dtos/follow.dtos";
import { FollowProfileHandler } from "@/app/handlers/follow/follow-profile.handler";
import { UnfollowProfileHandler } from "@/app/handlers/follow/unfollow-profile.handler";
import { GetFollowersHandler } from "@/app/handlers/follow/get-followers.handler";
import { GetFollowingHandler } from "@/app/handlers/follow/get-following.handler";
import { onErrorMiddleware } from "../middlewares/on-error.middleware";
import { authMiddleware } from "../middlewares/auth.middleware";

export const followController = (
    followProfileHandler = FollowProfileHandler.default,
    unfollowProfileHandler = UnfollowProfileHandler.default,
    getFollowersHandler = GetFollowersHandler.default,
    getFollowingHandler = GetFollowingHandler.default,
) => new Elysia({ prefix: "/follows" })
    .use(onErrorMiddleware)
    .use(authMiddleware)
    .guard({
        detail: { tags: ['Follows'] }
    })

    .post('/:followedProfileId', async ({ profile, params }) => {
        return await followProfileHandler.handle(profile.id, params.followedProfileId);
    }, {
        detail: { summary: "Follow a profile" },
        params: followDto
    })

    .delete('/:followedProfileId', async ({ profile, params }) => {
        return await unfollowProfileHandler.handle(profile.id, params.followedProfileId);
    }, {
        detail: { summary: "Unfollow a profile" },
        params: followDto
    })

    .get('/followers/:followedProfileId', async ({ params }) => {
        return await getFollowersHandler.handle(params.followedProfileId);
    }, {
        detail: { summary: "Get all followers of a profile" },
        params: followDto
    })

    .get('/following/:followerProfileId', async ({ params }) => {
        return await getFollowingHandler.handle(params.followerProfileId);
    }, {
        detail: { summary: "Get all profiles that this profile is following" },
        params: z.object({
            followerProfileId: z.uuid()
        })
    });
