import z from "zod";
import Elysia, { status } from "elysia";
import { createPostDto, postDetailedDto, postDto, postQueryDto, postsPageDto } from "@/app/dtos/post.dtos";
import { likesDto, repostsDto } from "@/app/dtos/profile.dtos";
import { dateDto, idQueryDto, pageQueryDto } from "@/app/dtos/common.dtos";
import { onErrorMiddleware } from "../middlewares/on-error.middleware";
import { requireProfileMiddleware } from "../middlewares/require-profile.middleware";
import { CommandBus } from "@/app/cqrs/command-bus";

const getDefaultProps = () => ({
    bus: CommandBus.default,
})

export const postController = ({ bus } = getDefaultProps()) =>
    new Elysia({ prefix: "/posts" })
        .use(onErrorMiddleware)
        .guard({
            detail: { tags: ['Posts'] }
        })
        .model({
            PostsPage: postsPageDto,
            CreatePostPayload: createPostDto,
            PostDetailed: postDetailedDto,
            Post: postDto,
            LikesPage: likesDto,
            RepostsPage: repostsDto,
            DeletedResponse: z.object({
                message: z.string(),
                deletedAt: dateDto
            }),
            NoContent: z.never()
        })

        .get('/', async ({ query }) => {
            return await bus.execute("findPosts", query);
        }, {
            detail: {
                operationId: "findPosts",
                summary: "Find posts 🌍"
            },
            query: postQueryDto,
            response: {
                200: 'PostsPage'
            }
        })

        .get('/:id', async ({ params }) => {
            return await bus.execute("getPostById", params.id);
        }, {
            detail: {
                operationId: "getPostById",
                summary: "Get post by ID 🌍",
                security: []
            },
            params: idQueryDto,
            response: {
                200: 'PostDetailed',
                404: 'NotFoundError'
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
                detail: {
                    operationId: "createPost",
                    summary: "Create a new post"
                },
                body: 'CreatePostPayload',
                response: {
                    201: 'Post',
                    401: 'UnauthorizedError',
                    403: 'ForbiddenError',
                    404: 'NotFoundError',
                    422: 'UnprocessableEntity'
                }
            })

            .group('/:id', (app) => app
                .delete('/', async ({ profile, params }) => {
                    return await bus.execute("deletePost", {
                        id: params.id,
                        profileId: profile.id
                    });
                }, {
                    detail: {
                        operationId: "deletePost",
                        summary: "Delete post by ID"
                    },
                    params: idQueryDto,
                    response: {
                        200: 'DeletedResponse',
                        401: 'UnauthorizedError',
                        403: 'ForbiddenError',
                        404: 'NotFoundError'
                    }
                })

                .post('/likes', async ({ user, profile, params, set }) => {
                    await bus.execute("likePost", { postId: params.id, user, profile });
                    set.status = 204;
                }, {
                    detail: {
                        operationId: "likePost",
                        summary: "Like a post"
                    },
                    params: idQueryDto,
                    response: {
                        204: 'NoContent',
                        401: 'UnauthorizedError',
                        403: 'ForbiddenError'
                    }
                })

                .delete('/likes', async ({ profile, params, set }) => {
                    await bus.execute("unlikePost", { profileId: profile.id, postId: params.id });
                    set.status = 204;
                }, {
                    detail: {
                        operationId: "unlikePost",
                        summary: "Unlike a post"
                    },
                    params: idQueryDto,
                    response: {
                        204: 'NoContent',
                        401: 'UnauthorizedError',
                        403: 'ForbiddenError'
                    }
                })

                .get('/likes', async ({ params, query }) => {
                    return await bus.execute("getPostLikes", {
                        postId: params.id,
                        cursor: query.cursor,
                        limit: query.limit
                    });
                }, {
                    detail: {
                        operationId: "getPostLikes",
                        summary: "Get likes of a post"
                    },
                    params: idQueryDto,
                    query: pageQueryDto,
                    response: {
                        200: 'LikesPage',
                        404: 'NotFoundError'
                    }
                })

                .post('/reposts', async ({ user, profile, params, set }) => {
                    await bus.execute("repostPost", { postId: params.id, user, profile });
                    set.status = 204;
                }, {
                    detail: {
                        operationId: "repostPost",
                        summary: "Repost a post"
                    },
                    params: idQueryDto,
                    response: {
                        204: 'NoContent',
                        401: 'UnauthorizedError',
                        403: 'ForbiddenError'
                    }
                })

                .delete('/reposts', async ({ profile, params, set }) => {
                    await bus.execute("unrepostPost", { profileId: profile.id, postId: params.id });
                    set.status = 204;
                }, {
                    detail: {
                        operationId: "unrepostPost",
                        summary: "Unrepost a post"
                    },
                    params: idQueryDto,
                    response: {
                        204: 'NoContent',
                        401: 'UnauthorizedError',
                        403: 'ForbiddenError'
                    }
                })

                .get('/reposts', async ({ params, query }) => {
                    return await bus.execute("getPostReposts", {
                        postId: params.id,
                        cursor: query.cursor,
                        limit: query.limit
                    });
                }, {
                    detail: {
                        operationId: "getPostReposts",
                        summary: "Get reposts of a post"
                    },
                    params: idQueryDto,
                    query: pageQueryDto,
                    response: {
                        200: 'RepostsPage',
                        404: 'NotFoundError'
                    }
                })

                .get('/replies', async ({ params, query }) => {
                    return await bus.execute("getPostReplies", {
                        postId: params.id,
                        cursor: query.cursor,
                        limit: query.limit
                    });
                }, {
                    detail: {
                        operationId: "getPostReplies",
                        summary: "Get replies of a post"
                    },
                    params: idQueryDto,
                    query: pageQueryDto,
                    response: {
                        200: 'PostsPage',
                        404: 'NotFoundError'
                    }
                })

                .get('/quotes', async ({ params, query }) => {
                    return await bus.execute("getPostQuotes", {
                        postId: params.id,
                        cursor: query.cursor,
                        limit: query.limit
                    });
                }, {
                    detail: {
                        operationId: "getPostQuotes",
                        summary: "Get quotes of a post"
                    },
                    params: idQueryDto,
                    query: pageQueryDto,
                    response: {
                        200: 'PostsPage',
                        404: 'NotFoundError'
                    }
                })
            )
        );
