import { profileDto } from "@/app/dtos/profile.dtos";
import { CreateUserDto, userDto } from "@/app/dtos/user.dtos";
import { Profile } from "@/database/entities/profile";
import { User } from "@/database/entities/user";
import { DataSource } from "typeorm";

export class CreateUserHandler {
    constructor(private readonly dataSource: DataSource) { }

    async handle(data: CreateUserDto) {
        return await this.dataSource.transaction(async (transactionalEntityManager) => {
            try {
                const user = transactionalEntityManager.create(User, {
                    email: data.email,
                    phone: data.phone,
                    passwordHash: data.password // TODO: Encrypt password
                });
                const savedUser = await transactionalEntityManager.save(user);

                const profile = transactionalEntityManager.create(Profile, {
                    username: data.profile.username,
                    displayName: data.profile.displayName,
                    bio: data.profile.bio,
                    userId: savedUser.id
                });
                const savedProfile = await transactionalEntityManager.save(profile);

                return {
                    ...userDto.parse(savedUser),
                    profile: profileDto.parse(savedProfile)
                };

            } catch (error) {
                console.error('Error on transaction:', error);
                return null;
            }
        });
    }
}