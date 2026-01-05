import z from "zod";
import Elysia, { status } from "elysia";
import { createPostDto, postDetailedDto, postDto, postQueryDto, postsPageDto } from "@/app/dtos/post.dtos";
import { FindPostsHandler } from "@/app/handlers/post/find-posts.handler";
import { CreatePostHandler } from "@/app/handlers/post/create-post.handler";
import { GetPostByIdHandler } from "@/app/handlers/post/get-post-by-id.handler";
import { DeletePostHandler } from "@/app/handlers/post/delete-post.handler";
import { LikePostHandler } from "@/app/handlers/like/like-post.handler";
import { UnlikePostHandler } from "@/app/handlers/like/unlike-post.handler";
import { RepostPostHandler } from "@/app/handlers/repost/repost-post.handler";
import { UnrepostPostHandler } from "@/app/handlers/repost/unrepost-post.handler";
import { onErrorMiddleware } from "../middlewares/on-error.middleware";
import { requireProfileMiddleware } from "../middlewares/require-profile.middleware";

const postIdParam = z.object({
    id: z.uuid()
});

const getDefaultProps = () => ({
    handlers: {
        findPosts: FindPostsHandler.default,
        getPostById: GetPostByIdHandler.default,
        createPost: CreatePostHandler.default,
        deletePost: DeletePostHandler.default,
        likePost: LikePostHandler.default,
        unlikePost: UnlikePostHandler.default,
        repostPost: RepostPostHandler.default,
        unrepostPost: UnrepostPostHandler.default
    }
})

export const postController = ({ handlers } = getDefaultProps()) =>
    new Elysia({ prefix: "/posts" })
    .use(onErrorMiddleware)
    .guard({
        detail: { tags: ['Posts'] }
    })

    .get('/', async ({ query }) => {
        return await handlers.findPosts.handle(query);
    }, {
        detail: { summary: "Find posts" },
        query: postQueryDto,
        response: {
            200: postsPageDto
        }
    })

    .get('/:id', async ({ params }) => {
        return await handlers.getPostById.handle(params.id);
    }, {
        detail: {
            summary: "Get post by ID 🌍",
            security: []
        },
        params: postIdParam,
        response: {
            200: postDetailedDto,
            404: z.object({
                message: z.string()
            })
        }
    })

    .group('', (app) => app
        .use(requireProfileMiddleware)
        .post('/', async ({ body, user, profile }) => {
            const post = await handlers.createPost.handle({
                data: body, user, profile
            });
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
                return await handlers.deletePost.handle({
                    id: params.id,
                    profileId: profile.id
                });
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
                await handlers.likePost.handle({ postId: params.id, user, profile });
                return status("No Content");
            }, {
                detail: { summary: "Like a post" },
                params: postIdParam
            })

            .delete('/like', async ({ profile, params }) => {
                await handlers.unlikePost.handle({ profileId: profile.id, postId: params.id });
                return status("No Content");
            }, {
                detail: { summary: "Unlike a post" },
                params: postIdParam
            })

            .post('/repost', async ({ user, profile, params, status }) => {
                await handlers.repostPost.handle({ postId: params.id, user, profile });
                return status("No Content");
            }, {
                detail: { summary: "Repost a post" },
                params: postIdParam
            })

            .delete('/repost', async ({ profile, params, status }) => {
                await handlers.unrepostPost.handle({ profileId: profile.id, postId: params.id });
                return status("No Content");
            }, {
                detail: { summary: "Unrepost a post" },
                params: postIdParam
            })
        )
    );
