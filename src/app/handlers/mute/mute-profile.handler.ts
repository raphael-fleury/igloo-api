import { Repository } from "typeorm";
import { appDataSource } from "@/database/data-source";
import { ProfileInteraction, ProfileInteractionType } from "@/database/entities/profile-interaction";
import { Profile } from "@/database/entities/profile";
import { InteractionValidator } from "@/app/validators/interaction.validator";
import { ConflictError } from "@/app/errors";

import { CommandHandler } from "@/app/cqrs";

type MuteProfileCommand = {
    sourceProfileId: string;
    targetProfileId: string;
}

export class MuteProfileHandler implements CommandHandler<MuteProfileCommand, void> {
    constructor(
        private readonly profileInteractionRepository: Repository<ProfileInteraction>,
        private readonly profileRepository: Repository<Profile>,
        private readonly interactionValidator: InteractionValidator
    ) { }

    static get default() {
        return new MuteProfileHandler(
            appDataSource.getRepository(ProfileInteraction),
            appDataSource.getRepository(Profile),
            InteractionValidator.default
        );
    }

    async handle({ sourceProfileId, targetProfileId }: MuteProfileCommand) {
        // Validations
        await this.interactionValidator.assertProfilesAreNotSame(sourceProfileId, targetProfileId);
        const sourceProfile = await this.interactionValidator.assertProfileExists(sourceProfileId);
        const targetProfile = await this.interactionValidator.assertProfileExists(targetProfileId);


        const existingMute = await this.profileInteractionRepository.findOne({
            where: {
                sourceProfile: { id: sourceProfileId },
                targetProfile: { id: targetProfileId },
                interactionType: ProfileInteractionType.Mute
            }
        });

        if (existingMute) {
            throw new ConflictError("Profile is already muted");
        }

        // Creation
        const mute = this.profileInteractionRepository.create({
            sourceProfile: sourceProfile,
            targetProfile: targetProfile,
            interactionType: ProfileInteractionType.Mute
        });

        await this.profileInteractionRepository.save(mute);
    }
}
