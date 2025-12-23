import Elysia from "elysia";
import { repostDto } from "@/app/dtos/repost.dtos";
import { RepostPostHandler } from "@/app/handlers/repost/repost-post.handler";
import { UnrepostPostHandler } from "@/app/handlers/repost/unrepost-post.handler";
import { onErrorMiddleware } from "../middlewares/on-error.middleware";
import { authMiddleware } from "../middlewares/auth.middleware";

export const repostController = (
    repostPostHandler = RepostPostHandler.default,
    unrepostPostHandler = UnrepostPostHandler.default,
) => new Elysia({ prefix: "/reposts" })
    .use(onErrorMiddleware)
    .use(authMiddleware)
    .guard({
        detail: { tags: ['Reposts'] }
    })

    .post('/:postId', async ({ user, profile, params }) => {
        return await repostPostHandler.handle(params.postId, user, profile);
    }, {
        detail: { summary: "Repost a post" },
        params: repostDto
    })

    .delete('/:postId', async ({ profile, params }) => {
        return await unrepostPostHandler.handle(profile.id, params.postId);
    }, {
        detail: { summary: "Unrepost a post" },
        params: repostDto
    });

