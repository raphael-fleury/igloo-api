import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index, Column } from "typeorm";
import { Profile } from "./profile";
import { Post } from "./post";

export enum NotificationType {
    Follow = "follow",
    Like = "like",
    Repost = "repost",
    Reply = "reply",
    Quote = "quote"
}

@Entity("notifications")
@Index("idx_notifications_target_created", ["targetProfile", "createdAt"])
@Index("idx_notifications_target_read_created", ["targetProfile", "isRead", "createdAt"])
@Index("idx_notifications_post_id", ["post"])
export class Notification {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne(() => Profile)
    @JoinColumn({ name: "target_profile_id" })
    targetProfile!: Profile;

    @ManyToOne(() => Profile)
    @JoinColumn({ name: "actor_profile_id" })
    actorProfile!: Profile;

    @Column({
        type: "enum",
        enum: NotificationType
    })
    type!: NotificationType;

    @ManyToOne(() => Post, { nullable: true })
    @JoinColumn({ name: "post_id" })
    post?: Post;

    @Column({ type: "boolean", default: false })
    isRead!: boolean;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn({ select: false })
    updatedAt!: Date;
}
