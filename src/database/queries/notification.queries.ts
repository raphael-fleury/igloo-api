import { SelectQueryBuilder } from "typeorm";
import { Notification } from "@/database/entities/notification";

interface NotificationQuery {
    profileId: string;
    cursor?: string;
}

export const findNotifications = (query: NotificationQuery) =>
    (qb: SelectQueryBuilder<Notification>) => {
        qb.where("notification.target_profile_id = :profileId", {
            profileId: query.profileId
        })
            .leftJoinAndSelect("notification.actorProfile", "actorProfile")
            .leftJoinAndSelect("notification.targetProfile", "targetProfile")
            .leftJoinAndSelect("notification.post", "post")
            .leftJoinAndSelect("post.profile", "postProfile")
            .orderBy("notification.createdAt", "DESC")
            .addOrderBy("notification.id", "DESC");

        if (query.cursor) {
            qb.andWhere("notification.id < :cursor", { cursor: query.cursor });
        }

        return qb;
    };
