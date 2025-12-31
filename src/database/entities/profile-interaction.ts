import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index, Column } from "typeorm";
import { Profile } from "./profile";

export enum ProfileInteractionType {
    Follow = "follow",
    Mute = "mute",
    Block = "block"
}

@Entity("profile_interactions")
@Index(["sourceProfile", "targetProfile", "interactionType"], { unique: true })
export class ProfileInteraction {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne(() => Profile)
    @JoinColumn({ name: "sourceProfileId" })
    sourceProfile!: Profile;

    @ManyToOne(() => Profile)
    @JoinColumn({ name: "targetProfileId" })
    targetProfile!: Profile;

    @Column({
        type: "enum",
        enum: ProfileInteractionType,
    })
    interactionType!: ProfileInteractionType;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}

