import z from "zod";
import Elysia, { status } from "elysia";
import { createPostDto, postDetailedDto, postDto, postQueryDto, postsPageDto } from "@/app/dtos/post.dtos";
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
        detail: { summary: "Find posts" },
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
                await bus.execute("likePost", { postId: params.id, user, profile });
                return status("No Content");
            }, {
                detail: { summary: "Like a post" },
                params: postIdParam
            })

            .delete('/like', async ({ profile, params }) => {
                await bus.execute("unlikePost", { profileId: profile.id, postId: params.id });
                return status("No Content");
            }, {
                detail: { summary: "Unlike a post" },
                params: postIdParam
            })

            .post('/repost', async ({ user, profile, params, status }) => {
                await bus.execute("repostPost", { postId: params.id, user, profile });
                return status("No Content");
            }, {
                detail: { summary: "Repost a post" },
                params: postIdParam
            })

            .delete('/repost', async ({ profile, params, status }) => {
                await bus.execute("unrepostPost", { profileId: profile.id, postId: params.id });
                return status("No Content");
            }, {
                detail: { summary: "Unrepost a post" },
                params: postIdParam
            })
        )
    );
