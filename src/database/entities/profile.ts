import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { DISPLAYNAME_MAX_LENGTH, USERNAME_MAX_LENGTH } from "@/app/dtos/profile.dtos";
import { User } from "./user";

@Entity("profiles")
export class Profile {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: USERNAME_MAX_LENGTH, unique: true })
  username!: string;

  @Column({ type: "varchar", length: DISPLAYNAME_MAX_LENGTH })
  displayName!: string;

  @Column({ type: "text", nullable: true, default: "" })
  bio?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToMany(() => User, user => user.profiles)
  users?: User[];
}
