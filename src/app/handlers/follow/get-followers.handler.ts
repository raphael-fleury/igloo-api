import { Repository } from "typeorm";
import { appDataSource } from "@/database/data-source";
import { ProfileInteraction, ProfileInteractionType } from "@/database/entities/profile-interaction";
import { FollowsDto, profileDto } from "@/app/dtos/profile.dtos";
import { CommandHandler } from "@/app/cqrs";

type GetFollowersCommand = {
    targetProfileId: string;
}

export class GetFollowersHandler implements CommandHandler<GetFollowersCommand, FollowsDto> {
    constructor(private readonly profileInteractionRepository: Repository<ProfileInteraction>) { }

    static get default() {
        return new GetFollowersHandler(appDataSource.getRepository(ProfileInteraction));
    }

    async handle({ targetProfileId }: GetFollowersCommand) {
        const follows = await this.profileInteractionRepository.find({
            where: {
                targetProfile: { id: targetProfileId },
                interactionType: ProfileInteractionType.Follow
            },
            relations: ["sourceProfile"],
            order: {
                createdAt: "DESC"
            }
        });

        return {
            profiles: follows.map(follow => ({
                ...profileDto.parse(follow.sourceProfile),
                followedAt: follow.createdAt
            })),
            total: follows.length
        };
    }
}
