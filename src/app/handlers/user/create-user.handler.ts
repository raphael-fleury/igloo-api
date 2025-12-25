import { DataSource } from "typeorm";
import { profileDto } from "@/app/dtos/profile.dtos";
import { CreateUserDto, userDto } from "@/app/dtos/user.dtos";
import { AlreadyExistsError } from "@/app/errors";
import { Profile } from "@/database/entities/profile";
import { User } from "@/database/entities/user";
import { UserProfile } from "@/database/entities/user-profile";
import { appDataSource } from "@/database/data-source";

export class CreateUserHandler {
    constructor(private readonly dataSource: DataSource) { }

    static get default() {
        return new CreateUserHandler(appDataSource);
    }

    async handle(data: CreateUserDto) {
        return await this.dataSource.transaction(async (transactionalEntityManager) => {
            const existingUserByEmail = await transactionalEntityManager.findOne(User, {
                where: { email: data.email }
            });
            if (existingUserByEmail) {
                throw new AlreadyExistsError(`Email ${data.email} already exists`);
            }

            if (data.phone) {
                const existingUserByPhone = await transactionalEntityManager.findOne(User, {
                    where: { phone: data.phone }
                });
                if (existingUserByPhone) {
                    throw new AlreadyExistsError(`Phone number ${data.phone} already exists`);
                }
            }

            const existingProfile = await transactionalEntityManager.findOne(Profile, {
                where: { username: data.profile.username }
            });
            if (existingProfile) {
                throw new AlreadyExistsError(`Username ${data.profile.username} already exists`);
            }

            const hash = await Bun.password.hash(data.password, {
                algorithm: "bcrypt",
                cost: 12
            });

            const user = transactionalEntityManager.create(User, {
                email: data.email,
                phone: data.phone,
                passwordHash: hash
            });
            const savedUser = await transactionalEntityManager.save(user);

            const profile = transactionalEntityManager.create(Profile, {
                username: data.profile.username,
                displayName: data.profile.displayName,
                bio: data.profile.bio
            });
            const savedProfile = await transactionalEntityManager.save(profile);

            const userProfile = transactionalEntityManager.create(UserProfile, {
                user: savedUser,
                profile: savedProfile
            });
            await transactionalEntityManager.save(userProfile);

            return {
                ...userDto.parse(savedUser),
                profile: profileDto.parse(savedProfile)
            };
        });
    }
}