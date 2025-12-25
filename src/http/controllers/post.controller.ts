import z from "zod";
import Elysia, { status } from "elysia";
import { createPostDto, postDto } from "@/app/dtos/post.dtos";
import { UnauthorizedError } from "@/app/errors";
import { CreatePostHandler } from "@/app/handlers/post/create-post.handler";
import { GetPostByIdHandler } from "@/app/handlers/post/get-post-by-id.handler";
import { DeletePostHandler } from "@/app/handlers/post/delete-post.handler";
import { LikePostHandler } from "@/app/handlers/like/like-post.handler";
import { UnlikePostHandler } from "@/app/handlers/like/unlike-post.handler";
import { RepostPostHandler } from "@/app/handlers/repost/repost-post.handler";
import { UnrepostPostHandler } from "@/app/handlers/repost/unrepost-post.handler";
import { onErrorMiddleware } from "../middlewares/on-error.middleware";
import { authMiddleware } from "../middlewares/auth.middleware";

const postIdParam = z.object({
    id: z.uuid()
});

export const postController = (
    createPostHandler = CreatePostHandler.default,
    getPostByIdHandler = GetPostByIdHandler.default,
    deletePostHandler = DeletePostHandler.default,
    likePostHandler = LikePostHandler.default,
    unlikePostHandler = UnlikePostHandler.default,
    repostPostHandler = RepostPostHandler.default,
    unrepostPostHandler = UnrepostPostHandler.default,
) => new Elysia({ prefix: "/posts" })
    .use(onErrorMiddleware)
    .guard({
        detail: { tags: ['Posts'] }
    })

    .get('/:id', async ({ params }) => {
        return await getPostByIdHandler.handle(params.id);
    }, {
        detail: { summary: "Get post by ID (public)" },
        params: postIdParam,
        response: {
            200: postDto,
            404: z.object({
                message: z.string()
            })
        }
    })

    .group('', (app) => app
        .use(authMiddleware)
        .onBeforeHandle(async ({ profile }) => {
            if (!profile)
                throw new UnauthorizedError("You must be logged in a profile to do this action");
        })
        .post('/', async ({ body, user, profile }) => {
            const post = await createPostHandler.handle(body, user, profile!);
            return status(201, post);
        }, {
            detail: { summary: "Create a new post" },
            body: createPostDto,
            response: {
                201: postDto,
                404: z.object({
                    message: z.string()
                })
            }
        })

        .group('/:id', (app) => app
            .delete('/', async ({ profile, params }) => {
                return await deletePostHandler.handle(params.id, profile!.id);
            }, {
                detail: { summary: "Delete post by ID" },
                params: postIdParam,
                response: {
                    200: z.object({
                        message: z.string(),
                        deletedAt: z.date()
                    }),
                    404: z.object({
                        message: z.string()
                    }),
                    403: z.object({
                        message: z.string()
                    })
                }
            })

            .post('/like', async ({ user, profile, params, status }) => {
                await likePostHandler.handle(params.id, user, profile!);
                return status("No Content");
            }, {
                detail: { summary: "Like a post" },
                params: postIdParam
            })

            .delete('/like', async ({ profile, params }) => {
                await unlikePostHandler.handle(profile!.id, params.id);
                return status("No Content");
            }, {
                detail: { summary: "Unlike a post" },
                params: postIdParam
            })

            .post('/repost', async ({ user, profile, params, status }) => {
                await repostPostHandler.handle(params.id, user, profile!);
                return status("No Content");
            }, {
                detail: { summary: "Repost a post" },
                params: postIdParam
            })

            .delete('/repost', async ({ profile, params, status }) => {
                await unrepostPostHandler.handle(profile!.id, params.id);
                return status("No Content");
            }, {
                detail: { summary: "Unrepost a post" },
                params: postIdParam
            })
        )
    );
