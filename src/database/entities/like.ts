import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from "typeorm";
import { Profile } from "./profile";
import { Post } from "./post";
import { User } from "./user";

@Entity("likes")
@Index(["profile", "post"], { unique: true })
export class Like {
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

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}

