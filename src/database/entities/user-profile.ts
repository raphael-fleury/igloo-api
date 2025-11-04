import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from "typeorm";

@Entity("user_profiles")
@Index(["user", "profile"], { unique: true })
export class UserProfile {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne("User", "userProfiles", { onDelete: "CASCADE" })
    @JoinColumn({ name: "userId" })
    user!: any;

    @ManyToOne("Profile", "userProfiles", { onDelete: "CASCADE" })
    @JoinColumn({ name: "profileId" })
    profile!: any;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}