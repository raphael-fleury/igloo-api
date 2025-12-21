import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Profile } from "./profile";

@Entity("follows")
export class Follow {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne("Profile", { eager: true })
    @JoinColumn({ name: "followerProfileId" })
    followerProfile!: Profile;

    @ManyToOne("Profile", { eager: true })
    @JoinColumn({ name: "followedProfileId" })
    followedProfile!: Profile;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}