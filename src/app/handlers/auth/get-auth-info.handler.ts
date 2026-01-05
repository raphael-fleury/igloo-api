import { Repository } from "typeorm";
import { User } from "@/database/entities/user";
import { UserProfile } from "@/database/entities/user-profile";
import { appDataSource } from "@/database/data-source";
import { authInfoDto, AuthInfoDto, TokenPayloadDto } from "@/app/dtos/auth.dtos";
import { UnauthorizedError } from "@/app/errors";
import { userDto } from "@/app/dtos/user.dtos";
import { CommandHandler } from "@/app/cqrs";

export class GetAuthInfoHandler implements CommandHandler<TokenPayloadDto, AuthInfoDto> {
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

        return authInfoDto.parse(userProfile);
    }
}