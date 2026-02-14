import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from "typeorm";
import { Post } from "./post";
import { Profile } from "./profile";

@Entity("mentions")
@Index("idx_mentions_post_id", ["post"])
@Index("idx_mentions_mentioned_profile_id", ["mentionedProfile"])
@Index("idx_mentions_post_mentioned_profile", ["post", "mentionedProfile"], { unique: true })
export class Mention {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne(() => Post, { onDelete: "CASCADE" })
    @JoinColumn({ name: "post_id" })
    post!: Post;

    @ManyToOne(() => Profile)
    @JoinColumn({ name: "mentioned_profile_id" })
    mentionedProfile!: Profile;

    @Column({ type: "varchar", length: 255 })
    usernameAtMention!: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn({ select: false })
    updatedAt!: Date;
}
