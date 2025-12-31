import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index, Column } from "typeorm";
import { Profile } from "./profile";
import { Post } from "./post";
import { User } from "./user";

export enum InteractionType {
    Like = "like",
    Repost = "repost"
}

@Entity("post_interactions")
@Index(["profile", "post", "interactionType"], { unique: true })
export class PostInteraction {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: "user_id" })
    user!: User;

    @ManyToOne(() => Profile)
    @JoinColumn({ name: "profile_id" })
    profile!: Profile;

    @ManyToOne(() => Post)
    @JoinColumn({ name: "post_id" })
    post!: Post;

    @Column({
        type: "enum",
        enum: InteractionType,
    })
    interactionType!: InteractionType;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}

