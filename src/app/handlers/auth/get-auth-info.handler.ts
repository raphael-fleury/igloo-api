import { Repository } from "typeorm";
import { User } from "@/database/entities/user";
import { UserProfile } from "@/database/entities/user-profile";
import { appDataSource } from "@/database/data-source";
import { TokenPayloadDto } from "@/app/dtos/auth.dtos";
import { UnauthorizedError } from "@/app/errors";
import { userDto } from "@/app/dtos/user.dtos";
import { profileDto } from "@/app/dtos/profile.dtos";

export class GetAuthInfoHandler {
    constructor(
        private readonly userRepository: Repository<User>,
        private readonly userProfileRepository: Repository<UserProfile>
    ) { }

    static get default() {
        return new GetAuthInfoHandler(
            appDataSource.getRepository(User),
            appDataSource.getRepository(UserProfile)
        );
    }

    async handle({ userId, profileId }: TokenPayloadDto) {
        if (!profileId) {
            const user = await this.userRepository.findOneBy({ id: userId });
            if (!user) {
                throw new UnauthorizedError('Invalid token');
            }
            return { user: userDto.parse(user) };
        }

        const userProfile = await this.userProfileRepository.findOne({
            where: {
                user: { id: userId },
                profile: { id: profileId }
            },
            relations: {
                user: true,
                profile: true
            }
        });

        if (!userProfile) {
            throw new UnauthorizedError('Invalid token');
        }

        const user = userDto.parse(userProfile.user);
        const profile = profileDto.parse(userProfile.profile);

        return { user, profile };
    }
}