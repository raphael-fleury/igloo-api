import z from "zod";
import { dateDto, idDto, pageDto, pageQueryDto } from "./common.dtos";
import { profileDto } from "./profile.dtos";
import { postDto } from "./post.dtos";

export const notificationTypeDto = z.enum(["follow", "like", "repost", "reply", "quote"]);

export const notificationDto = z.object({
    id: idDto,
    type: notificationTypeDto,
    targetProfile: profileDto,
    actorProfile: profileDto,
    post: postDto.nullable().optional(),
    isRead: z.boolean(),
    createdAt: dateDto
});

export const notificationsPageDto = pageDto.extend({
    items: z.array(notificationDto)
});

export type NotificationDto = z.infer<typeof notificationDto>;
export type NotificationsPageDto = z.infer<typeof notificationsPageDto>;
export type NotificationTypeDto = z.infer<typeof notificationTypeDto>;
