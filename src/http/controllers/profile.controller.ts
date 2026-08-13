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
    .model({
        Profile: profileDto,
        FollowsPage: followsDto,
        NoContent: z.never()
    })

    .get('/:id', async ({ params }) => {
        return await bus.execute("getProfileById", params.id);
    }, {
        detail: {
            operationId: "getProfileById",
            summary: "Get profile by ID (public)"
        },
        params: profileIdParam,
        response: {
            200: 'Profile',
            404: 'NotFoundError'
        }
    })

    .group('/:id', (app) => app
        .use(requireProfileMiddleware)
        .get('/followers', async ({ params, query }) => {
            return await bus.execute("getFollowers", { targetProfileId: params.id, ...query });
        }, {
            detail: {
                operationId: "getProfileFollowers",
                summary: "Get followers of a profile"
            },
            params: profileIdParam,
            query: pageQueryDto,
            response: {
                200: 'FollowsPage',
                401: 'UnauthorizedError',
                403: 'ForbiddenError',
                404: 'NotFoundError'
            }
        })

        .get('/following', async ({ params, query }) => {
            return await bus.execute("getFollowing", { sourceProfileId: params.id, ...query });
        }, {
            detail: {
                operationId: "getProfileFollowing",
                summary: "Get all profiles followed by this one"
            },
            params: profileIdParam,
            query: pageQueryDto,
            response: {
                200: 'FollowsPage',
                401: 'UnauthorizedError',
                403: 'ForbiddenError',
                404: 'NotFoundError'
            }
        })

        .post('/block', async ({ profile, params, set }) => {
            await bus.execute("blockProfile", { sourceProfileId: profile.id, targetProfileId: params.id });
            set.status = 204;
        }, {
            detail: {
                operationId: "blockProfile",
                summary: "Block a profile"
            },
            params: profileIdParam,
            response: {
                204: 'NoContent',
                401: 'UnauthorizedError',
                403: 'ForbiddenError'
            }
        })

        .delete('/block', async ({ profile, params, set }) => {
            await bus.execute("unblockProfile", { sourceProfileId: profile.id, targetProfileId: params.id });
            set.status = 204;
        }, {
            detail: {
                operationId: "unblockProfile",
                summary: "Unblock a profile"
            },
            params: profileIdParam,
            response: {
                204: 'NoContent',
                401: 'UnauthorizedError',
                403: 'ForbiddenError'
            }
        })

        .post('/mute', async ({ profile, params, set }) => {
            await bus.execute("muteProfile", {
                sourceProfileId: profile.id,
                targetProfileId: params.id
            });
            set.status = 204;
        }, {
            detail: {
                operationId: "muteProfile",
                summary: "Mute a profile"
            },
            params: profileIdParam,
            response: {
                204: 'NoContent',
                401: 'UnauthorizedError',
                403: 'ForbiddenError'
            }
        })

        .delete('/mute', async ({ profile, params, set }) => {
            await bus.execute("unmuteProfile", {
                sourceProfileId: profile.id,
                targetProfileId: params.id
            });
            set.status = 204;
        }, {
            detail: {
                operationId: "unmuteProfile",
                summary: "Unmute a profile"
            },
            params: profileIdParam,
            response: {
                204: 'NoContent',
                401: 'UnauthorizedError',
                403: 'ForbiddenError'
            }
        })

        .post('/follow', async ({ profile, params, set }) => {
            await bus.execute("followProfile", {
                sourceProfileId: profile.id,
                targetProfileId: params.id
            });
            set.status = 204;
        }, {
            detail: {
                operationId: "followProfile",
                summary: "Follow a profile"
            },
            params: profileIdParam,
            response: {
                204: 'NoContent',
                401: 'UnauthorizedError',
                403: 'ForbiddenError'
            }
        })

        .delete('/follow', async ({ profile, params, set }) => {
            await bus.execute("unfollowProfile", {
                sourceProfileId: profile.id,
                targetProfileId: params.id
            });
            set.status = 204;
        }, {
            detail: {
                operationId: "unfollowProfile",
                summary: "Unfollow a profile"
            },
            params: profileIdParam,
            response: {
                204: 'NoContent',
                401: 'UnauthorizedError',
                403: 'ForbiddenError'
            }
        })
    );
