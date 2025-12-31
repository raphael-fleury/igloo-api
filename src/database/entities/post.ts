import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Profile } from "./profile";
import { User } from "./user";

@Entity("posts")
export class Post {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: "user_id" })
    user!: User;

    @ManyToOne(() => Profile)
    @JoinColumn({ name: "profile_id" })
    profile!: Profile;

    @Column({ type: "text", nullable: false })
    content!: string;

    @ManyToOne(() => Post, post => post.replies, {
        nullable: true,
    })
    @JoinColumn({ name: "replied_post_id" })
    repliedPost?: Post;

    @OneToMany(() => Post, post => post.repliedPost)
    replies!: Post[];

    @ManyToOne(() => Post, post => post.quotes, {
        nullable: true,
    })
    @JoinColumn({ name: "quoted_post_id" })
    quotedPost?: Post;

    @OneToMany(() => Post, post => post.quotedPost)
    quotes!: Post[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}