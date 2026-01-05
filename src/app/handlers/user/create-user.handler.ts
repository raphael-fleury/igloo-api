import { DataSource } from "typeorm";
import { profileDto, ProfileDto } from "@/app/dtos/profile.dtos";
import { CreateUserDto, userDto, UserDto } from "@/app/dtos/user.dtos";
import { AlreadyExistsError } from "@/app/errors";
import { PasswordHashService } from "@/app/services/password-hash.service";
import { Profile } from "@/database/entities/profile";
import { User } from "@/database/entities/user";
import { UserProfile } from "@/database/entities/user-profile";
import { appDataSource } from "@/database/data-source";
import { CommandHandler } from "@/app/cqrs";

type CreateUserResult = UserDto & { profile: ProfileDto };

export class CreateUserHandler implements CommandHandler<CreateUserDto, CreateUserResult> {
    constructor(
        private readonly dataSource: DataSource,
        private readonly passwordHashService: PasswordHashService
    ) { }

    static get default() {
        return new CreateUserHandler(appDataSource, new PasswordHashService());
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

            const hash = await this.passwordHashService.hash(data.password);

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