import Elysia from "elysia";
import z from "zod";
import { updateProfileDto, profileDto, blockedProfilesDto, followsDto, mutedProfilesDto, uploadAvatarDto, uploadHeaderDto } from "@/app/dtos/profile.dtos";
import { onErrorMiddleware } from "../middlewares/on-error.middleware";
import { requireProfileMiddleware } from "../middlewares/require-profile.middleware";
import { CommandBus } from "@/app/cqrs/command-bus";
import { pageQueryDto } from "@/app/dtos/common.dtos";

const getDefaultProps = () => ({
    bus: CommandBus.default
})

export const currentProfileController = ({ bus } = getDefaultProps()) =>
    new Elysia({ prefix: "/me/profile" })
    .use(onErrorMiddleware)
    .use(requireProfileMiddleware)
    .guard({
        detail: { tags: ['Current Profile'] }
    })
    .model({
        Profile: profileDto,
        BlockedProfilesPage: blockedProfilesDto,
        FollowsPage: followsDto,
        MutedProfilesPage: mutedProfilesDto,
        NoContent: z.never().nullish()
    })

    .get('/', async ({ profile }) => {
        return profile;
    }, {
        detail: {
            operationId: "getCurrentProfile",
            summary: "Get current profile"
        },
        response: {
            200: 'Profile',
            401: 'UnauthorizedError',
            403: 'ForbiddenError'
        }
    })

    .patch('/', async ({ profile, body }) => {
        return await bus.execute("updateProfile", { id: profile.id, data: body });
    }, {
        detail: {
            operationId: "updateCurrentProfile",
            summary: "Update current profile"
        },
        body: updateProfileDto,
        response: {
            200: 'Profile',
            401: 'UnauthorizedError',
            403: 'ForbiddenError',
            409: 'ConflictError',
            422: 'UnprocessableEntity'
        }
    })

    .get('/blocks', async ({ profile, query }) => {
        return await bus.execute("getBlockedProfiles", { sourceProfileId: profile.id, ...query });
    }, {
        detail: {
            operationId: "getCurrentProfileBlockedProfiles",
            summary: "Get all profiles blocked by current profile"
        },
        query: pageQueryDto,
        response: {
            200: 'BlockedProfilesPage',
            401: 'UnauthorizedError',
            403: 'ForbiddenError'
        }
    })

    .get('/followers', async ({ profile, query }) => {
        return await bus.execute("getFollowers", { targetProfileId: profile.id, ...query });
    }, {
        detail: {
            operationId: "getCurrentProfileFollowers",
            summary: "Get all followers of current profile"
        },
        query: pageQueryDto,
        response: {
            200: 'FollowsPage',
            401: 'UnauthorizedError',
            403: 'ForbiddenError'
        }
    })

    .get('/following', async ({ profile, query }) => {
        return await bus.execute("getFollowing", { sourceProfileId: profile.id, ...query });
    }, {
        detail: {
            operationId: "getCurrentProfileFollowing",
            summary: "Get all profiles that current profile is following"
        },
        query: pageQueryDto,
        response: {
            200: 'FollowsPage',
            401: 'UnauthorizedError',
            403: 'ForbiddenError'
        }
    })

    .get('/mutes', async ({ profile, query }) => {
        return await bus.execute("getMutedProfiles", { sourceProfileId: profile.id, ...query });
    }, {
        detail: {
            operationId: "getCurrentProfileMutedProfiles",
            summary: "Get all profiles muted by current profile"
        },
        query: pageQueryDto,
        response: {
            200: 'MutedProfilesPage',
            401: 'UnauthorizedError',
            403: 'ForbiddenError'
        }
    })

    .post('/avatar', async ({ profile, body }) => {
        return await bus.execute("uploadAvatar", { id: profile.id, data: body });
    }, {
        detail: {
            operationId: "uploadCurrentProfileAvatar",
            summary: "Upload profile avatar"
        },
        body: uploadAvatarDto,
        response: {
            200: 'Profile',
            401: 'UnauthorizedError',
            403: 'ForbiddenError',
            404: 'NotFoundError',
            422: 'UnprocessableEntity'
        }
    })

    .delete('/avatar', async ({ profile, set }) => {
        await bus.execute("deleteAvatar", { id: profile.id });
        set.status = 204;
    }, {
        detail: {
            operationId: "deleteCurrentProfileAvatar",
            summary: "Delete profile avatar"
        },
        response: {
            204: 'NoContent',
            401: 'UnauthorizedError',
            403: 'ForbiddenError',
            404: 'NotFoundError'
        }
    })

    .post('/header', async ({ profile, body }) => {
        return await bus.execute("uploadHeader", { id: profile.id, data: body });
    }, {
        detail: {
            operationId: "uploadCurrentProfileHeader",
            summary: "Upload profile header"
        },
        body: uploadHeaderDto,
        response: {
            200: 'Profile',
            401: 'UnauthorizedError',
            403: 'ForbiddenError',
            404: 'NotFoundError',
            422: 'UnprocessableEntity'
        }
    })

    .delete('/header', async ({ profile, set }) => {
        await bus.execute("deleteHeader", { id: profile.id });
        set.status = 204;
    }, {
        detail: {
            operationId: "deleteCurrentProfileHeader",
            summary: "Delete profile header"
        },
        response: {
            204: 'NoContent',
            401: 'UnauthorizedError',
            403: 'ForbiddenError',
            404: 'NotFoundError'
        }
    });
