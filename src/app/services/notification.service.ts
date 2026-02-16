import { Repository } from "typeorm";
import { appDataSource } from "@/database/data-source";
import { Notification, NotificationType } from "@/database/entities/notification";

interface CreateNotificationInput {
    targetProfileId: string;
    actorProfileId: string;
    type: NotificationType;
    postId?: string;
}

export class NotificationService {
    constructor(private readonly notificationRepository: Repository<Notification>) {}

    static get default() {
        return new NotificationService(appDataSource.getRepository(Notification));
    }

    async createNotification(input: CreateNotificationInput): Promise<Notification> {
        const notification = this.notificationRepository.create({
            targetProfile: { id: input.targetProfileId } as any,
            actorProfile: { id: input.actorProfileId } as any,
            type: input.type,
            post: input.postId ? { id: input.postId } as any : undefined,
            isRead: false
        });

        return await this.notificationRepository.save(notification);
    }
}
