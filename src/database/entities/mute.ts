import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("mutes")
export class Mute {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne("Profile", { eager: true })
  @JoinColumn({ name: "muterProfileId" })
  muterProfile!: any;

  @ManyToOne("Profile", { eager: true })
  @JoinColumn({ name: "mutedProfileId" })
  mutedProfile!: any;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}