import { Repository } from "typeorm";
import { ConflictError } from "@/app/errors";
import { appDataSource } from "@/database/data-source";
import { ProfileInteraction, ProfileInteractionType } from "@/database/entities/profile-interaction";
import { CommandHandler } from "@/app/cqrs";

type UnblockProfileCommand = {
    sourceProfileId: string;
    targetProfileId: string;
}

export class UnblockProfileHandler implements CommandHandler<UnblockProfileCommand, void> {
    constructor(private readonly profileInteractionRepository: Repository<ProfileInteraction>) { }

    static get default() {
        return new UnblockProfileHandler(appDataSource.getRepository(ProfileInteraction));
    }

    async handle({ sourceProfileId, targetProfileId }: UnblockProfileCommand) {
        // Find the existing block
        const block = await this.profileInteractionRepository.findOne({
            where: {
                sourceProfile: { id: sourceProfileId },
                targetProfile: { id: targetProfileId },
                interactionType: ProfileInteractionType.Block
            }
        });

        if (!block) {
            throw new ConflictError(`Block between profiles not found`);
        }

        await this.profileInteractionRepository.remove(block);
    }
}
