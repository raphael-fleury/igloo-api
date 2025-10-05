import { Column, Entity, PrimaryGeneratedColumn, OneToOne, CreateDateColumn, UpdateDateColumn } from "typeorm";

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

    @OneToOne("Profile", "user", { cascade: true })
    profile?: any;
}