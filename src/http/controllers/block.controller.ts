import z from "zod";
import Elysia from "elysia";
import { blockCheckDto, blockDto } from "@/app/dtos/block.dtos";
import { BlockProfileHandler } from "@/app/handlers/block/block-profile.handler";
import { UnblockProfileHandler } from "@/app/handlers/block/unblock-profile.handler";
import { GetBlockedProfilesHandler } from "@/app/handlers/block/get-blocked-profiles.handler";
import { CheckBlockStatusHandler } from "@/app/handlers/block/check-block-status.handler";
import { onErrorMiddleware } from "../middlewares/on-error.middleware";
import { authMiddleware } from "../middlewares/auth.middleware";

export const blockController = (
    blockProfileHandler = BlockProfileHandler.default,
    unblockProfileHandler = UnblockProfileHandler.default,
    getBlockedProfilesHandler = GetBlockedProfilesHandler.default,
    checkBlockStatusHandler = CheckBlockStatusHandler.default,
) => new Elysia({ prefix: "/blocks" })
    .use(onErrorMiddleware)
    .use(authMiddleware)
    .guard({
        detail: { tags: ['Blocks'] }
    })

    .post('/:blockedProfileId', async ({ profile, params }) => {
        return await blockProfileHandler.handle(profile.id, params.blockedProfileId);
    }, {
        detail: { summary: "Block a profile" },
        params: blockDto
    })

    .delete('/:blockedProfileId', async ({ profile, params }) => {
        return await unblockProfileHandler.handle(profile.id, params.blockedProfileId);
    }, {
        detail: { summary: "Unblock a profile" },
        params: blockDto
    })

    .get('/', async ({ profile }) => {
        return await getBlockedProfilesHandler.handle(profile.id);
    }, {
        detail: { summary: "Get all profiles blocked by this profile" }
    })

    .get('/check/:blockerProfileId', async ({ profile, params }) => {
        return await checkBlockStatusHandler.handle(params.blockerProfileId, profile.id);
    }, {
        detail: { summary: "Check if one profile blocks mine" },
        params: blockCheckDto
    })
