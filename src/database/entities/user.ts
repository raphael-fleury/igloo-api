import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany, Index } from "typeorm";
import { UserProfile } from "./user-profile";

@Entity("users")
export class User {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "varchar", length: 15, unique: true })
    @Index("uq_users_phone", { unique: true })
    phone!: string;
    
    @Column({ type: "varchar", length: 100 })
    @Index("uq_users_email", { unique: true })
    email!: string;

    @Column({ type: "varchar", length: 255, select: false })
    passwordHash!: string;

    @Column({ type: "boolean", default: true })
    isActive!: boolean;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @OneToMany(() => UserProfile, "user")
    userProfiles?: UserProfile[];
}