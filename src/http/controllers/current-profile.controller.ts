import Elysia from "elysia";
import z from "zod";
import { updateProfileDto, profileDto, blockedProfilesDto, followsDto, mutedProfilesDto } from "@/app/dtos/profile.dtos";
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

    .get('/', async ({ profile }) => {
        return profile;
    }, {
        detail: { summary: "Get current profile" },
        response: {
            200: profileDto
        }
    })

    .patch('/', async ({ profile, body }) => {
        return await bus.execute("updateProfile", { id: profile.id, data: body });
    }, {
        detail: { summary: "Update current profile" },
        body: updateProfileDto,
        response: {
            200: profileDto,
            409: z.object({
                message: z.string()
            }),
            422: z.object({
                message: z.string()
            })
        }
    })

    .get('/blocks', async ({ profile, query }) => {
        return await bus.execute("getBlockedProfiles", { sourceProfileId: profile.id, ...query });
    }, {
        detail: { summary: "Get all profiles blocked by current profile" },
        query: pageQueryDto,
        response: {
            200: blockedProfilesDto
        }
    })

    .get('/followers', async ({ profile, query }) => {
        return await bus.execute("getFollowers", { targetProfileId: profile.id, ...query });
    }, {
        detail: { summary: "Get all followers of current profile" },
        query: pageQueryDto,
        response: {
            200: followsDto
        }
    })

    .get('/following', async ({ profile, query }) => {
        return await bus.execute("getFollowing", { sourceProfileId: profile.id, ...query });
    }, {
        detail: { summary: "Get all profiles that current profile is following" },
        query: pageQueryDto,
        response: {
            200: followsDto
        }
    })

    .get('/mutes', async ({ profile, query }) => {
        return await bus.execute("getMutedProfiles", { sourceProfileId: profile.id, ...query });
    }, {
        detail: { summary: "Get all profiles muted by current profile" },
        query: pageQueryDto,
        response: {
            200: mutedProfilesDto
        }
    });
