import { Repository } from "typeorm";
import { appDataSource } from "@/database/data-source";
import { Notification, NotificationType } from "@/database/entities/notification";
import { CommandHandler } from "@/app/cqrs";

interface CreateNotificationCommand {
    targetProfileId: string;
    actorProfileId: string;
    type: NotificationType;
    postId?: string;
}

export class CreateNotificationHandler implements CommandHandler<CreateNotificationCommand, Notification> {
    constructor(private readonly notificationRepository: Repository<Notification>) { }

    static get default() {
        return new CreateNotificationHandler(appDataSource.getRepository(Notification));
    }

    async handle(command: CreateNotificationCommand) {
        const notification = this.notificationRepository.create({
            targetProfile: { id: command.targetProfileId } as any,
            actorProfile: { id: command.actorProfileId } as any,
            type: command.type,
            post: command.postId ? { id: command.postId } as any : undefined,
            isRead: false
        });

        return await this.notificationRepository.save(notification);
    }
}
