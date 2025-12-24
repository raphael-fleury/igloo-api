import { Repository } from "typeorm";
import { appDataSource } from "@/database/data-source";
import { ProfileInteraction, ProfileInteractionType } from "@/database/entities/profile-interaction";
import { Profile } from "@/database/entities/profile";
import { InteractionValidator } from "@/app/validators/interaction.validator";
import { ConflictError } from "@/app/errors";

export class MuteProfileHandler {
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

    async handle(muterProfileId: string, mutedProfileId: string) {
        // Validations
        await this.interactionValidator.assertProfilesAreNotSame(muterProfileId, mutedProfileId);
        const muterProfile = await this.interactionValidator.assertProfileExists(muterProfileId);
        const mutedProfile = await this.interactionValidator.assertProfileExists(mutedProfileId);


        const existingMute = await this.profileInteractionRepository.findOne({
            where: {
                sourceProfile: { id: muterProfileId },
                targetProfile: { id: mutedProfileId },
                interactionType: ProfileInteractionType.Mute
            }
        });

        if (existingMute) {
            throw new ConflictError("Profile is already muted");
        }

        // Creation
        const mute = this.profileInteractionRepository.create({
            sourceProfile: muterProfile,
            targetProfile: mutedProfile,
            interactionType: ProfileInteractionType.Mute
        });

        const savedMute = await this.profileInteractionRepository.save(mute);

        return {
            message: "Profile muted successfully",
            mutedAt: savedMute.createdAt
        };
    }
}
