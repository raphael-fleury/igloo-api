import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Profile } from "./profile";
import { User } from "./user";

@Entity("posts")
export class Post {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne("User", { eager: true })
    @JoinColumn({ name: "userId" })
    user!: User;

    @ManyToOne("Profile", { eager: true })
    @JoinColumn({ name: "profileId" })
    profile!: Profile;

    @Column({ type: "text", nullable: false })
    content!: string;

    @ManyToOne(() => Post, post => post.replies, {
        nullable: true,
    })
    @JoinColumn({ name: "repliedPostId" })
    repliedPost?: Post;

    @OneToMany(() => Post, post => post.repliedPost)
    replies!: Post[];

    @ManyToOne(() => Post, post => post.quotes, {
        nullable: true,
    })
    @JoinColumn({ name: "quotedPostId" })
    quotedPost?: Post;

    @OneToMany(() => Post, post => post.quotedPost)
    quotes!: Post[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}