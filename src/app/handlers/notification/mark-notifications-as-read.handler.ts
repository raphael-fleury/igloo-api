import { Repository } from "typeorm";
import { appDataSource } from "@/database/data-source";
import { Notification } from "@/database/entities/notification";
import { CommandHandler } from "@/app/cqrs";

interface MarkNotificationsAsReadCommand {
    profileId: string;
    notificationIds?: string[];
}

export class MarkNotificationsAsReadHandler implements CommandHandler<MarkNotificationsAsReadCommand, void> {
    constructor(private readonly notificationRepository: Repository<Notification>) { }

    static get default() {
        return new MarkNotificationsAsReadHandler(appDataSource.getRepository(Notification));
    }

    async handle(command: MarkNotificationsAsReadCommand) {
        const qb = this.notificationRepository
            .createQueryBuilder("notification")
            .update(Notification)
            .set({ isRead: true })
            .where("notification.target_profile_id = :profileId", { profileId: command.profileId });

        if (command.notificationIds && command.notificationIds.length > 0) {
            qb.andWhere("notification.id IN (:...notificationIds)", { notificationIds: command.notificationIds });
        }

        await qb.execute();
    }
}
