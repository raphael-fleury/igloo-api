import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from "typeorm";
import { User } from "./user";
import { Profile } from "./profile";

@Entity("user_profiles")
@Index(["user", "profile"], { unique: true })
export class UserProfile {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne(() => User, "userProfiles", { onDelete: "CASCADE" })
    @JoinColumn({ name: "userId" })
    user!: User;

    @ManyToOne(() => Profile, "userProfiles", { onDelete: "CASCADE" })
    @JoinColumn({ name: "profileId" })
    profile!: Profile;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}