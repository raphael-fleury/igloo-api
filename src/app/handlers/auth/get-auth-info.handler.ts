import { Repository } from "typeorm";
import { User } from "@/database/entities/user";
import { Profile } from "@/database/entities/profile";
import { UserProfile } from "@/database/entities/user-profile";
import { appDataSource } from "@/database/data-source";
import { TokenPayloadDto } from "@/app/dtos/auth.dtos";
import { NotFoundError, UnauthorizedError } from "@/app/errors";
import { userDto } from "@/app/dtos/user.dtos";
import { profileDto } from "@/app/dtos/profile.dtos";

export class GetAuthInfoHandler {
    constructor(
        private readonly userRepository: Repository<User>,
        private readonly profileRepository: Repository<Profile>,
        private readonly userProfileRepository: Repository<UserProfile>
    ) { }

    static get default() {
        return new GetAuthInfoHandler(
            appDataSource.getRepository(User),
            appDataSource.getRepository(Profile),
            appDataSource.getRepository(UserProfile)
        );
    }

    async handle({ userId, profileId }: TokenPayloadDto) {
        const user = await this.userRepository.findOneBy({ id: userId });
        if (!user) {
            throw new NotFoundError('User not found');
        }

        if (!profileId) {
            return { user: userDto.parse(user) };
        }

        const profile = await this.profileRepository.findOneBy({ id: profileId });
        if (!profile) {
            throw new NotFoundError('Profile not found');
        }

        const userProfile = await this.userProfileRepository.findOneBy({
            user, profile
        });
        if (!userProfile) {
            throw new UnauthorizedError('User does not have access to this profile');
        }

        return {
            user: userDto.parse(user),
            profile: profileDto.parse(profile)
        }
    }
}