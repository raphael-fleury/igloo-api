import { Repository } from "typeorm";
import { appDataSource } from "@/database/data-source";
import { ProfileInteraction, ProfileInteractionType } from "@/database/entities/profile-interaction";

export class CheckBlockStatusHandler {
    constructor(private readonly profileInteractionRepository: Repository<ProfileInteraction>) { }

    static get default() {
        return new CheckBlockStatusHandler(appDataSource.getRepository(ProfileInteraction));
    }

    async handle(blockerProfileId: string, blockedProfileId: string) {
        const block = await this.profileInteractionRepository.findOne({
            where: {
                sourceProfile: { id: blockerProfileId },
                targetProfile: { id: blockedProfileId },
                interactionType: ProfileInteractionType.Block
            }
        });

        return {
            isBlocked: !!block,
            blockedAt: block?.createdAt || null
        };
    }
}