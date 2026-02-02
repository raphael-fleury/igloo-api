import z from "zod";
import Elysia, { status } from "elysia";
import { createPostDto, postDetailedDto, postDto, postQueryDto, postsPageDto } from "@/app/dtos/post.dtos";
import { likesDto, repostsDto } from "@/app/dtos/profile.dtos";
import { dateDto, pageQueryDto } from "@/app/dtos/common.dtos";
import { onErrorMiddleware } from "../middlewares/on-error.middleware";
import { requireProfileMiddleware } from "../middlewares/require-profile.middleware";
import { CommandBus } from "@/app/cqrs/command-bus";

const postIdParam = z.object({
    id: z.uuid()
});

const getDefaultProps = () => ({
    bus: CommandBus.default,
})

export const postController = ({ bus } = getDefaultProps()) =>
    new Elysia({ prefix: "/posts" })
        .use(onErrorMiddleware)
        .guard({
            detail: { tags: ['Posts'] }
        })

        .get('/', async ({ query }) => {
            return await bus.execute("findPosts", query);
        }, {
            detail: { summary: "Find posts 🌍" },
            query: postQueryDto,
            response: {
                200: postsPageDto
            }
        })

        .get('/:id', async ({ params }) => {
            return await bus.execute("getPostById", params.id);
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
                const post = await bus.execute("createPost", {
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
                    }),
                    422: z.object({
                        message: z.string()
                    })
                }
            })

            .group('/:id', (app) => app
                .delete('/', async ({ profile, params }) => {
                    return await bus.execute("deletePost", {
                        id: params.id,
                        profileId: profile.id
                    });
                }, {
                    detail: { summary: "Delete post by ID" },
                    params: postIdParam,
                    response: {
                        200: z.object({
                            message: z.string(),
                            deletedAt: dateDto
                        }),
                        404: z.object({
                            message: z.string()
                        }),
                        403: z.object({
                            message: z.string()
                        })
                    }
                })

                .post('/likes', async ({ user, profile, params, set }) => {
                    await bus.execute("likePost", { postId: params.id, user, profile });
                    set.status = 204;
                }, {
                    detail: { summary: "Like a post" },
                    params: postIdParam,
                    response: {
                        204: z.never()
                    }
                })

                .delete('/likes', async ({ profile, params, set }) => {
                    await bus.execute("unlikePost", { profileId: profile.id, postId: params.id });
                    set.status = 204;
                }, {
                    detail: { summary: "Unlike a post" },
                    params: postIdParam,
                    response: {
                        204: z.never()
                    }
                })

                .get('/likes', async ({ params, query }) => {
                    return await bus.execute("getPostLikes", {
                        postId: params.id,
                        cursor: query.cursor,
                        limit: query.limit
                    });
                }, {
                    detail: { summary: "Get likes of a post" },
                    params: postIdParam,
                    query: pageQueryDto,
                    response: {
                        200: likesDto
                    }
                })

                .post('/reposts', async ({ user, profile, params, set }) => {
                    await bus.execute("repostPost", { postId: params.id, user, profile });
                    set.status = 204;
                }, {
                    detail: { summary: "Repost a post" },
                    params: postIdParam,
                    response: {
                        204: z.never()
                    }
                })

                .delete('/reposts', async ({ profile, params, set }) => {
                    await bus.execute("unrepostPost", { profileId: profile.id, postId: params.id });
                    set.status = 204;
                }, {
                    detail: { summary: "Unrepost a post" },
                    params: postIdParam,
                    response: {
                        204: z.never()
                    }
                })

                .get('/reposts', async ({ params, query }) => {
                    return await bus.execute("getPostReposts", {
                        postId: params.id,
                        cursor: query.cursor,
                        limit: query.limit
                    });
                }, {
                    detail: { summary: "Get reposts of a post" },
                    params: postIdParam,
                    query: pageQueryDto,
                    response: {
                        200: repostsDto
                    }
                })

                .get('/replies', async ({ params, query }) => {
                    return await bus.execute("getPostReplies", {
                        postId: params.id,
                        cursor: query.cursor,
                        limit: query.limit
                    });
                }, {
                    detail: { summary: "Get replies of a post" },
                    params: postIdParam,
                    query: pageQueryDto,
                    response: {
                        200: postsPageDto
                    }
                })

                .get('/quotes', async ({ params, query }) => {
                    return await bus.execute("getPostQuotes", {
                        postId: params.id,
                        cursor: query.cursor,
                        limit: query.limit
                    });
                }, {
                    detail: { summary: "Get quotes of a post" },
                    params: postIdParam,
                    query: pageQueryDto,
                    response: {
                        200: postsPageDto
                    }
                })
            )
        );
