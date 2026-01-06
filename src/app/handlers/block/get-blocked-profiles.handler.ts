import { Repository } from "typeorm";
import { appDataSource } from "@/database/data-source";
import { ProfileInteraction, ProfileInteractionType } from "@/database/entities/profile-interaction";
import { BlockedProfilesDto, profileDto } from "@/app/dtos/profile.dtos";
import { CommandHandler } from "@/app/cqrs";
import { SourceProfileDto } from "@/app/dtos/post-interaction.dto";

export class GetBlockedProfilesHandler implements CommandHandler<SourceProfileDto, BlockedProfilesDto> {
    constructor(private readonly profileInteractionRepository: Repository<ProfileInteraction>) { }

    static get default() {
        return new GetBlockedProfilesHandler(appDataSource.getRepository(ProfileInteraction));
    }

    async handle({ sourceProfileId }: SourceProfileDto) {
        const blocks = await this.profileInteractionRepository.find({
            where: {
                sourceProfile: { id: sourceProfileId },
                interactionType: ProfileInteractionType.Block
            },
            relations: ["targetProfile"],
            order: {
                createdAt: "DESC"
            }
        });

        return {
            profiles: blocks.map(block => ({
                ...profileDto.parse(block.targetProfile),
                blockedAt: block.createdAt
            })),
            total: blocks.length
        };
    }
}
