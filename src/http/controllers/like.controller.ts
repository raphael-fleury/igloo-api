import Elysia from "elysia";
import { likeDto } from "@/app/dtos/like.dtos";
import { LikePostHandler } from "@/app/handlers/like/like-post.handler";
import { UnlikePostHandler } from "@/app/handlers/like/unlike-post.handler";
import { onErrorMiddleware } from "../middlewares/on-error.middleware";
import { authMiddleware } from "../middlewares/auth.middleware";

export const likeController = (
    likePostHandler = LikePostHandler.default,
    unlikePostHandler = UnlikePostHandler.default,
) => new Elysia({ prefix: "/likes" })
    .use(onErrorMiddleware)
    .use(authMiddleware)
    .guard({
        detail: { tags: ['Likes'] }
    })

    .post('/:postId', async ({ user, profile, params }) => {
        return await likePostHandler.handle(params.postId, user, profile);
    }, {
        detail: { summary: "Like a post" },
        params: likeDto
    })

    .delete('/:postId', async ({ profile, params }) => {
        return await unlikePostHandler.handle(profile.id, params.postId);
    }, {
        detail: { summary: "Unlike a post" },
        params: likeDto
    });

