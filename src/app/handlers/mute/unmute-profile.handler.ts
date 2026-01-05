import { Repository } from "typeorm";
import { ConflictError } from "@/app/errors";
import { appDataSource } from "@/database/data-source";
import { ProfileInteraction, ProfileInteractionType } from "@/database/entities/profile-interaction";

import { CommandHandler } from "@/app/cqrs";

type UnmuteProfileCommand = {
    sourceProfileId: string;
    targetProfileId: string;
}

export class UnmuteProfileHandler implements CommandHandler<UnmuteProfileCommand, void> {
    constructor(private readonly profileInteractionRepository: Repository<ProfileInteraction>) { }

    static get default() {
        return new UnmuteProfileHandler(appDataSource.getRepository(ProfileInteraction));
    }

    async handle({ sourceProfileId, targetProfileId }: UnmuteProfileCommand) {
        // Find the existing mute
        const mute = await this.profileInteractionRepository.findOne({
            where: {
                sourceProfile: { id: sourceProfileId },
                targetProfile: { id: targetProfileId },
                interactionType: ProfileInteractionType.Mute
            }
        });

        if (!mute) {
            throw new ConflictError(`Mute between profiles not found`);
        }

        // Remove the mute
        await this.profileInteractionRepository.remove(mute);
    }
}
