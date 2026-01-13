import Elysia from "elysia";
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

        .get('/following', async ({ profile, query }) => {
            return await bus.execute("getFollowingFeed", {
                profileId: profile.id,
                cursor: query.cursor,
                limit: query.limit
            });
        }, {
            detail: { summary: "Get following feed" },
            query: pageQueryDto,
            response: {
                200: postsPageDto
            }
        });

