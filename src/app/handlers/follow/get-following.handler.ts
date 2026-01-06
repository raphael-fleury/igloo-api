import { Repository } from "typeorm";
import { appDataSource } from "@/database/data-source";
import { ProfileInteraction, ProfileInteractionType } from "@/database/entities/profile-interaction";
import { FollowsDto, profileDto } from "@/app/dtos/profile.dtos";
import { CommandHandler } from "@/app/cqrs";
import { SourceProfileDto } from "@/app/dtos/post-interaction.dto";

export class GetFollowingHandler implements CommandHandler<SourceProfileDto, FollowsDto> {
    constructor(private readonly profileInteractionRepository: Repository<ProfileInteraction>) { }

    static get default() {
        return new GetFollowingHandler(appDataSource.getRepository(ProfileInteraction));
    }

    async handle({ sourceProfileId }: SourceProfileDto) {
        const follows = await this.profileInteractionRepository.find({
            where: {
                sourceProfile: { id: sourceProfileId },
                interactionType: ProfileInteractionType.Follow
            },
            relations: ["targetProfile"],
            order: {
                createdAt: "DESC"
            }
        });

        return {
            profiles: follows.map(follow => ({
                ...profileDto.parse(follow.targetProfile),
                followedAt: follow.createdAt
            })),
            total: follows.length
        };
    }
}
