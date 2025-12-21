import z from "zod";
import Elysia, { status } from "elysia";
import { createPostDto, postDto } from "@/app/dtos/post.dtos";
import { CreatePostHandler } from "@/app/handlers/post/create-post.handler";
import { GetPostByIdHandler } from "@/app/handlers/post/get-post-by-id.handler";
import { DeletePostHandler } from "@/app/handlers/post/delete-post.handler";
import { onErrorMiddleware } from "../middlewares/on-error.middleware";
import { authMiddleware } from "../middlewares/auth.middleware";

export const postController = (
    createPostHandler = CreatePostHandler.default,
    getPostByIdHandler = GetPostByIdHandler.default,
    deletePostHandler = DeletePostHandler.default,
) => new Elysia({ prefix: "/posts" })
    .use(onErrorMiddleware)
    .use(authMiddleware)
    .guard({
        detail: { tags: ['Posts'] }
    })

    .post('/', async ({ body, set }) => {
        const post = await createPostHandler.handle(body);
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

    .get('/:id', async ({ params }) => {
        return await getPostByIdHandler.handle(params.id);
    }, {
        detail: { summary: "Get post by ID" },
        params: z.object({
            id: z.uuid()
        }),
        response: {
            200: postDto,
            404: z.object({
                message: z.string()
            })
        }
    })

    .delete('/:id', async ({ profile, params }) => {
        return await deletePostHandler.handle(params.id, profile.id);
    }, {
        detail: { summary: "Delete post by ID" },
        params: z.object({
            id: z.uuid()
        }),
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
    });
