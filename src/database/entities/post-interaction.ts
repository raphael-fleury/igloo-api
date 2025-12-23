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

    @ManyToOne("User", { eager: true })
    @JoinColumn({ name: "userId" })
    user!: User;

    @ManyToOne("Profile", { eager: true })
    @JoinColumn({ name: "profileId" })
    profile!: Profile;

    @ManyToOne("Post", { eager: true })
    @JoinColumn({ name: "postId" })
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

