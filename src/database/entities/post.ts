import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn, Index } from "typeorm";
import { Profile } from "./profile";
import { User } from "./user";

@Entity("posts")
export class Post {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: "user_id" })
    user!: User;

    @ManyToOne(() => Profile, { eager: true })
    @JoinColumn({ name: "profile_id" })
    profile!: Profile;

    @Column({ type: "text", nullable: false })
    content!: string;

    @ManyToOne(() => Post, post => post.replies, {
        nullable: true,
    })
    @JoinColumn({ name: "replied_post_id" })
    @Index("idx_posts_replied_post_id")
    repliedPost?: Post;

    @OneToMany(() => Post, post => post.repliedPost)
    replies!: Post[];

    @ManyToOne(() => Post, post => post.quotes, {
        nullable: true,
    })
    @JoinColumn({ name: "quoted_post_id" })
    @Index("idx_posts_quoted_post_id")
    quotedPost?: Post;

    @OneToMany(() => Post, post => post.quotedPost)
    quotes!: Post[];

    @CreateDateColumn()
    @Index("idx_posts_created_at")
    createdAt!: Date;

    @UpdateDateColumn({ select: false })
    updatedAt!: Date;
}
