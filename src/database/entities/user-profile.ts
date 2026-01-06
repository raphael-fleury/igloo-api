import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from "typeorm";
import { User } from "./user";
import { Profile } from "./profile";

@Entity("user_profiles")
@Index("uq_user_profiles_user_profile", ["user", "profile"], { unique: true })
export class UserProfile {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne(() => User, "user_profiles", { onDelete: "CASCADE" })
    @JoinColumn({ name: "user_id" })
    user!: any;

    @ManyToOne(() => Profile, "user_profiles", { onDelete: "CASCADE" })
    @JoinColumn({ name: "profile_id" })
    profile!: any;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}