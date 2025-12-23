import { Repository } from "typeorm";
import { appDataSource } from "@/database/data-source";
import { ProfileInteraction, ProfileInteractionType } from "@/database/entities/profile-interaction";
import { profileDto } from "@/app/dtos/profile.dtos";

export class GetBlockedProfilesHandler {
    constructor(private readonly profileInteractionRepository: Repository<ProfileInteraction>) { }

    static get default() {
        return new GetBlockedProfilesHandler(appDataSource.getRepository(ProfileInteraction));
    }

    async handle(blockerProfileId: string) {
        const blocks = await this.profileInteractionRepository.find({
            where: {
                sourceProfile: { id: blockerProfileId },
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