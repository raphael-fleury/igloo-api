import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("blocks")
export class Block {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne("Profile", { eager: true })
  @JoinColumn({ name: "blockerProfileId" })
  blockerProfile!: any;

  @ManyToOne("Profile", { eager: true })
  @JoinColumn({ name: "blockedProfileId" })
  blockedProfile!: any;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}