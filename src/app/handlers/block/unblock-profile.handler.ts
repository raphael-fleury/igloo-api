import { Repository } from "typeorm";
import { ConflictError } from "@/app/errors";
import { appDataSource } from "@/database/data-source";
import { ProfileInteraction, ProfileInteractionType } from "@/database/entities/profile-interaction";

export class UnblockProfileHandler {
    constructor(private readonly profileInteractionRepository: Repository<ProfileInteraction>) { }

    static get default() {
        return new UnblockProfileHandler(appDataSource.getRepository(ProfileInteraction));
    }

    async handle(blockerProfileId: string, blockedProfileId: string) {
        // Find the existing block
        const block = await this.profileInteractionRepository.findOne({
            where: {
                sourceProfile: { id: blockerProfileId },
                targetProfile: { id: blockedProfileId },
                interactionType: ProfileInteractionType.Block
            }
        });

        if (!block) {
            throw new ConflictError(`Block between profiles not found`);
        }

        // Remove the block
        await this.profileInteractionRepository.remove(block);

        return {
            message: "Profile unblocked successfully",
            unblockedAt: new Date()
        };
    }
}
