import { Repository } from "typeorm";
import { NotFoundError, SelfInteractionError } from "@/app/errors";
import { appDataSource } from "@/database/data-source";
import { ProfileInteraction, ProfileInteractionType } from "@/database/entities/profile-interaction";
import { Profile } from "@/database/entities/profile";

export class MuteProfileHandler {
    constructor(
        private readonly profileInteractionRepository: Repository<ProfileInteraction>,
        private readonly profileRepository: Repository<Profile>
    ) { }

    static get default() {
        return new MuteProfileHandler(
            appDataSource.getRepository(ProfileInteraction),
            appDataSource.getRepository(Profile)
        );
    }

    async handle(muterProfileId: string, mutedProfileId: string) {
        // Validations
        if (muterProfileId === mutedProfileId) {
            throw new SelfInteractionError("A profile cannot mute itself");
        }

        const muterProfile = await this.profileRepository.findOneBy({ id: muterProfileId });
        if (!muterProfile) {
            throw new NotFoundError(`Muter profile with id ${muterProfileId} not found`);
        }

        const mutedProfile = await this.profileRepository.findOneBy({ id: mutedProfileId });
        if (!mutedProfile) {
            throw new NotFoundError(`Muted profile with id ${mutedProfileId} not found`);
        }

        const existingMute = await this.profileInteractionRepository.findOne({
            where: {
                sourceProfile: { id: muterProfileId },
                targetProfile: { id: mutedProfileId },
                interactionType: ProfileInteractionType.Mute
            }
        });

        if (existingMute) {
            return { message: "Profile is already muted", mutedAt: existingMute.createdAt };
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
