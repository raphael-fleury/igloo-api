import z from "zod";
import Elysia from "elysia";
import { requireProfileMiddleware } from "../middlewares/require-profile.middleware";
import { onErrorMiddleware } from "../middlewares/on-error.middleware";
import { CommandBus } from "@/app/cqrs/command-bus";
import { pageQueryDto } from "@/app/dtos/common.dtos";
import { profileDto, followsDto } from "@/app/dtos/profile.dtos";

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
        params: profileIdParam,
        response: {
            200: profileDto,
            404: z.object({
                message: z.string()
            })
        }
    })

    .group('/:id', (app) => app
        .use(requireProfileMiddleware)
        .get('/followers', async ({ params, query }) => {
            return await bus.execute("getFollowers", { targetProfileId: params.id, ...query });
        }, {
            detail: { summary: "Get followers of a profile" },
            params: profileIdParam,
            query: pageQueryDto,
            response: {
                200: followsDto
            }
        })

        .get('/following', async ({ params, query }) => {
            return await bus.execute("getFollowing", { sourceProfileId: params.id, ...query });
        }, {
            detail: { summary: "Get all profiles followed by this one" },
            params: profileIdParam,
            query: pageQueryDto,
            response: {
                200: followsDto
            }
        })

        .post('/block', async ({ profile, params, set }) => {
            await bus.execute("blockProfile", { sourceProfileId: profile.id, targetProfileId: params.id });
            set.status = 204;
        }, {
            detail: { summary: "Block a profile" },
            params: profileIdParam,
            response: {
                204: z.never()
            }
        })

        .delete('/block', async ({ profile, params, set }) => {
            await bus.execute("unblockProfile", { sourceProfileId: profile.id, targetProfileId: params.id });
            set.status = 204;
        }, {
            detail: { summary: "Unblock a profile" },
            params: profileIdParam,
            response: {
                204: z.never()
            }
        })

        .post('/mute', async ({ profile, params, set }) => {
            await bus.execute("muteProfile", {
                sourceProfileId: profile.id,
                targetProfileId: params.id
            });
            set.status = 204;
        }, {
            detail: { summary: "Mute a profile" },
            params: profileIdParam,
            response: {
                204: z.never()
            }
        })

        .delete('/mute', async ({ profile, params, set }) => {
            await bus.execute("unmuteProfile", {
                sourceProfileId: profile.id,
                targetProfileId: params.id
            });
            set.status = 204;
        }, {
            detail: { summary: "Unmute a profile" },
            params: profileIdParam,
            response: {
                204: z.never()
            }
        })

        .post('/follow', async ({ profile, params, set }) => {
            await bus.execute("followProfile", {
                sourceProfileId: profile.id,
                targetProfileId: params.id
            });
            set.status = 204;
        }, {
            detail: { summary: "Follow a profile" },
            params: profileIdParam,
            response: {
                204: z.never()
            }
        })

        .delete('/follow', async ({ profile, params, set }) => {
            await bus.execute("unfollowProfile", {
                sourceProfileId: profile.id,
                targetProfileId: params.id
            });
            set.status = 204;
        }, {
            detail: { summary: "Unfollow a profile" },
            params: profileIdParam,
            response: {
                204: z.never()
            }
        })
    );
