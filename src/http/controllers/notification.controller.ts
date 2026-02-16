import Elysia from "elysia";
import { onErrorMiddleware } from "../middlewares/on-error.middleware";
import { requireProfileMiddleware } from "../middlewares/require-profile.middleware";
import { CommandBus } from "@/app/cqrs/command-bus";
import { pageQueryDto } from "@/app/dtos/common.dtos";
import { notificationsPageDto } from "@/app/dtos/notification.dtos";
import z from "zod";
import { idDto } from "@/app/dtos/common.dtos";

const getDefaultProps = () => ({
    bus: CommandBus.default,
})

const markNotificationsAsReadDto = z.object({
    notificationIds: z.array(idDto).optional()
});

export const notificationController = ({ bus } = getDefaultProps()) =>
    new Elysia({ prefix: "/notifications" })
        .use(onErrorMiddleware)
        .use(requireProfileMiddleware)
        .guard({
            detail: { tags: ['Notifications'] }
        })

        .get('/', async ({ profile, query }) => {
            return await bus.execute("getNotifications", {
                profileId: profile.id,
                cursor: query.cursor,
                limit: query.limit
            });
        }, {
            detail: { summary: "Get user notifications" },
            query: pageQueryDto,
            response: {
                200: notificationsPageDto
            }
        })
        .post('/read', async ({ profile, body }) => {
            await bus.execute("markNotificationsAsRead", {
                profileId: profile.id,
                notificationIds: body.notificationIds
            });

            return { success: true };
        }, {
            detail: { summary: "Mark notifications as read" },
            body: markNotificationsAsReadDto,
            response: {
                200: z.object({ success: z.boolean() })
            }
        });
