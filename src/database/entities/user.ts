import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany, Index } from "typeorm";
import { UserProfile } from "./user-profile";

@Entity("users")
@Index(["email"], { unique: true })
@Index(["phone"], { unique: true })
export class User {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "varchar", length: 15, unique: true })
    phone!: string;
    
    @Column({ type: "varchar", length: 100 })
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