import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Profile } from "./profile";

@Entity("mutes")
export class Mute {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne("Profile", { eager: true })
    @JoinColumn({ name: "muterProfileId" })
    muterProfile!: Profile;

    @ManyToOne("Profile", { eager: true })
    @JoinColumn({ name: "mutedProfileId" })
    mutedProfile!: Profile;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}