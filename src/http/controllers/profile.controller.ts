import z from "zod";
import Elysia from "elysia";
import { requireProfileMiddleware } from "../middlewares/require-profile.middleware";
import { onErrorMiddleware } from "../middlewares/on-error.middleware";
import { CommandBus } from "@/app/cqrs/command-bus";
import { pageQueryDto } from "@/app/dtos/common.dtos";

const profileIdParam = z.object({
    id: z.uuid()
});

const getDefaultProps = () => ({
    bus: CommandBus.default
})

export const profileController = ({ bus } = getDefaultProps()) =>
    new Elysia({ prefix: "/profiles" })
    .use(onErrorMiddleware)
    .guard({
        detail: { tags: ['Profiles'] }
    })

    .get('/:id', async ({ params }) => {
        return await bus.execute("getProfileById", params.id);
    }, {
        detail: { summary: "Get profile by ID (public)" },
        params: profileIdParam
    })

    .group('/:id', (app) => app
        .use(requireProfileMiddleware)
        .get('/followers', async ({ params, query }) => {
            return await bus.execute("getFollowers", { targetProfileId: params.id, ...query });
        }, {
            detail: { summary: "Get followers of a profile" },
            params: profileIdParam,
            query: pageQueryDto
        })

        .get('/following', async ({ params, query }) => {
            return await bus.execute("getFollowing", { sourceProfileId: params.id, ...query });
        }, {
            detail: { summary: "Get all profiles followed by this one" },
            params: profileIdParam,
            query: pageQueryDto
        })

        .post('/block', async ({ profile, params, status }) => {
            await bus.execute("blockProfile", { sourceProfileId: profile.id, targetProfileId: params.id });
            return status("No Content");
        }, {
            detail: { summary: "Block a profile" },
            params: profileIdParam
        })

        .delete('/block', async ({ profile, params, status }) => {
            await bus.execute("unblockProfile", { sourceProfileId: profile.id, targetProfileId: params.id });
            return status("No Content");
        }, {
            detail: { summary: "Unblock a profile" },
            params: profileIdParam
        })

        .post('/mute', async ({ profile, params, status }) => {
            await bus.execute("muteProfile", {
                sourceProfileId: profile.id,
                targetProfileId: params.id
            });
            return status("No Content");
        }, {
            detail: { summary: "Mute a profile" },
            params: profileIdParam
        })

        .delete('/mute', async ({ profile, params, status }) => {
            await bus.execute("unmuteProfile", {
                sourceProfileId: profile.id,
                targetProfileId: params.id
            });
            return status("No Content");
        }, {
            detail: { summary: "Unmute a profile" },
            params: profileIdParam
        })

        .post('/follow', async ({ profile, params, status }) => {
            await bus.execute("followProfile", {
                sourceProfileId: profile.id,
                targetProfileId: params.id
            });
            return status("No Content");
        }, {
            detail: { summary: "Follow a profile" },
            params: profileIdParam
        })

        .delete('/follow', async ({ profile, params, status }) => {
            await bus.execute("unfollowProfile", {
                sourceProfileId: profile.id,
                targetProfileId: params.id
            });
            return status("No Content");
        }, {
            detail: { summary: "Unfollow a profile" },
            params: profileIdParam
        })
    );
