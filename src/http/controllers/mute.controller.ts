import Elysia from "elysia";
import { muteDto } from "@/app/dtos/mute.dtos";
import { MuteProfileHandler } from "@/app/handlers/mute/mute-profile.handler";
import { UnmuteProfileHandler } from "@/app/handlers/mute/unmute-profile.handler";
import { GetMutedProfilesHandler } from "@/app/handlers/mute/get-muted-profiles.handler";
import { onErrorMiddleware } from "../middlewares/on-error.middleware";
import { authMiddleware } from "../middlewares/auth.middleware";

export const muteController = (
    muteProfileHandler = MuteProfileHandler.default,
    unmuteProfileHandler = UnmuteProfileHandler.default,
    getMutedProfilesHandler = GetMutedProfilesHandler.default,
) => new Elysia({ prefix: "/mutes" })
    .use(onErrorMiddleware)
    .use(authMiddleware)
    .guard({
        detail: { tags: ['Mutes'] }
    })

    .post('/:mutedProfileId', async ({ profile, params }) => {
        return await muteProfileHandler.handle(profile.id, params.mutedProfileId);
    }, {
        detail: { summary: "Mute a profile" },
        params: muteDto
    })

    .delete('/:mutedProfileId', async ({ profile, params }) => {
        return await unmuteProfileHandler.handle(profile.id, params.mutedProfileId);
    }, {
        detail: { summary: "Unmute a profile" },
        params: muteDto
    })

    .get('/', async ({ profile }) => {
        return await getMutedProfilesHandler.handle(profile.id);
    }, {
        detail: { summary: "Get all profiles muted by this profile" }
    });
