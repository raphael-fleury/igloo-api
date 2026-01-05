import Elysia from "elysia";
import { updateProfileDto } from "@/app/dtos/profile.dtos";
import { onErrorMiddleware } from "../middlewares/on-error.middleware";
import { requireProfileMiddleware } from "../middlewares/require-profile.middleware";
import { CommandBus } from "@/app/cqrs/command-bus";

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
        detail: { summary: "Get current profile" }
    })

    .patch('/', async ({ profile, body }) => {
        return await bus.execute("updateProfile", { id: profile.id, data: body });
    }, {
        detail: { summary: "Update current profile" },
        body: updateProfileDto
    })

    .get('/blocks', async ({ profile }) => {
        return await bus.execute("getBlockedProfiles", { sourceProfileId: profile.id });
    }, {
        detail: { summary: "Get all profiles blocked by current profile" }
    })

    .get('/followers', async ({ profile }) => {
        return await bus.execute("getFollowers", { targetProfileId: profile.id });
    }, {
        detail: { summary: "Get all followers of current profile" }
    })

    .get('/following', async ({ profile }) => {
        return await bus.execute("getFollowing", { sourceProfileId: profile.id });
    }, {
        detail: { summary: "Get all profiles that current profile is following" }
    })

    .get('/mutes', async ({ profile }) => {
        return await bus.execute("getMutedProfiles", { sourceProfileId: profile.id });
    }, {
        detail: { summary: "Get all profiles muted by current profile" }
    });
