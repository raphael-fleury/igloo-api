import Elysia from "elysia";
import z from "zod";
import { onErrorMiddleware } from "../middlewares/on-error.middleware";
import { requireProfileMiddleware } from "../middlewares/require-profile.middleware";
import { CommandBus } from "@/app/cqrs/command-bus";
import { pageQueryDto } from "@/app/dtos/common.dtos";
import { postsPageDto } from "@/app/dtos/post.dtos";

const getDefaultProps = () => ({
    bus: CommandBus.default,
})

export const feedController = ({ bus } = getDefaultProps()) =>
    new Elysia({ prefix: "/feeds" })
        .use(onErrorMiddleware)
        .use(requireProfileMiddleware)
        .guard({
            detail: { tags: ['Feeds'] }
        })
        .model({
            UnauthorizedError: z.object({
                message: z.string()
            }),
            ForbiddenError: z.object({
                message: z.string()
            })
        })

        .get('/following', async ({ profile, query }) => {
            return await bus.execute("getFollowingFeed", {
                profileId: profile.id,
                cursor: query.cursor,
                limit: query.limit
            });
        }, {
            detail: {
                operationId: "getFollowingFeed",
                summary: "Get following feed"
            },
            query: pageQueryDto,
            response: {
                200: postsPageDto,
                401: 'UnauthorizedError',
                403: 'ForbiddenError'
            }
        })
        .get('/trending', async ({ query }) => {
            return await bus.execute("getTrendingFeed", {
                cursor: query.cursor,
                limit: query.limit
            });
        }, {
            detail: {
                operationId: "getTrendingFeed",
                summary: "Get trending feed"
            },
            query: pageQueryDto,
            response: {
                200: postsPageDto,
                401: 'UnauthorizedError',
                403: 'ForbiddenError'
            }
        });
