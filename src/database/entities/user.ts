import { Column, Entity, PrimaryGeneratedColumn, ManyToMany, JoinTable, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Profile } from "./profile";

@Entity("users")
export class User {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "varchar", length: 15, unique: true })
    phone?: string;
    
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

    @ManyToMany(() => Profile, profile => profile.users, { cascade: true })
    @JoinTable({
        name: "user_profiles",
        joinColumn: { name: "userId", referencedColumnName: "id" },
        inverseJoinColumn: { name: "profileId", referencedColumnName: "id" }
    })
    profiles?: Profile[];
}