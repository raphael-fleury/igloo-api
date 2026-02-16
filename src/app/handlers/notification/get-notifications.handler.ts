import { Repository } from "typeorm";
import { appDataSource } from "@/database/data-source";
import { Notification } from "@/database/entities/notification";
import { notificationsPageDto, NotificationsPageDto, notificationDto } from "@/app/dtos/notification.dtos";
import { findNotifications } from "@/database/queries/notification.queries";
import { CommandHandler } from "@/app/cqrs";

interface GetNotificationsQuery {
    profileId: string;
    cursor?: string;
    limit?: number;
}

const DEFAULT_LIMIT = 15;
const MAX_LIMIT = 30;

export class GetNotificationsHandler implements CommandHandler<GetNotificationsQuery, NotificationsPageDto> {
    constructor(private readonly notificationRepository: Repository<Notification>) { }

    static get default() {
        return new GetNotificationsHandler(appDataSource.getRepository(Notification));
    }

    async handle(query: GetNotificationsQuery) {
        const limit = Math.min(MAX_LIMIT, query.limit ?? DEFAULT_LIMIT);

        const notifications = await this.notificationRepository
            .createQueryBuilder("notification")
            .apply(findNotifications({
                profileId: query.profileId,
                cursor: query.cursor
            }))
            .take(limit + 1)
            .getMany();

        const hasNextPage = notifications.length > limit;

        if (hasNextPage) {
            notifications.pop();
        }

        return notificationsPageDto.parse({
            hasNextPage,
            nextCursor: hasNextPage ? notifications[notifications.length - 1].id : undefined,
            count: notifications.length,
            items: notifications.map(notification =>
                notificationDto.parse({
                    ...notification,
                    post: notification.post || null
                })
            ),
        });
    }
}
