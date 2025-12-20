import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Profile } from "./profile";

@Entity("blocks")
export class Block {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne("Profile", { eager: true })
    @JoinColumn({ name: "blockerProfileId" })
    blockerProfile!: Profile;

    @ManyToOne("Profile", { eager: true })
    @JoinColumn({ name: "blockedProfileId" })
    blockedProfile!: Profile;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}