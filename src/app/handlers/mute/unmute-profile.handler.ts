import { Repository } from "typeorm";
import { NotFoundError } from "@/app/errors";
import { appDataSource } from "@/database/data-source";
import { ProfileInteraction, ProfileInteractionType } from "@/database/entities/profile-interaction";

export class UnmuteProfileHandler {
    constructor(private readonly profileInteractionRepository: Repository<ProfileInteraction>) { }

    static get default() {
        return new UnmuteProfileHandler(appDataSource.getRepository(ProfileInteraction));
    }

    async handle(muterProfileId: string, mutedProfileId: string) {
        // Find the existing mute
        const mute = await this.profileInteractionRepository.findOne({
            where: {
                sourceProfile: { id: muterProfileId },
                targetProfile: { id: mutedProfileId },
                interactionType: ProfileInteractionType.Mute
            }
        });

        if (!mute) {
            throw new NotFoundError(`Mute between profiles not found`);
        }

        // Remove the mute
        await this.profileInteractionRepository.remove(mute);

        return {
            message: "Profile unmuted successfully",
            unmutedAt: new Date()
        };
    }
}
