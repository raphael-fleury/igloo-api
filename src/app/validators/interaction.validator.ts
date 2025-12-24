import { Repository } from "typeorm";
import { appDataSource } from "@/database/data-source";
import { ProfileInteraction, ProfileInteractionType } from "@/database/entities/profile-interaction";
import { Profile } from "@/database/entities/profile";
import { BlockedError, NotFoundError, SelfInteractionError } from "../errors";

export class InteractionValidator {
    constructor(
        private readonly profileInteractionRepository: Repository<ProfileInteraction>,
        private readonly profileRepository: Repository<Profile>
    ) { }

    static get default() {
        return new InteractionValidator(
            appDataSource.getRepository(ProfileInteraction),
            appDataSource.getRepository(Profile)
        );
    }

    async assertProfileExists(profileId: string) {
        const profile = await this.profileRepository.findOneBy({ id: profileId });
        if (!profile) {
            throw new NotFoundError(`Profile with id ${profileId} not found`);
        }
        return profile;
    }

    async isProfileBlockingAnother(sourceProfileId: string, targetProfileId: string) {
        return await this.profileInteractionRepository.exists({
            where: {
                sourceProfile: { id: sourceProfileId },
                targetProfile: { id: targetProfileId },
                interactionType: ProfileInteractionType.Block
            }
        });
    } 

    async assertProfileIsNotBlocked(userProfileId: string, targetProfileId: string) {
        if (await this.isProfileBlockingAnother(userProfileId, targetProfileId)) {
            throw new BlockedError(`You cannot interact with a profile you have blocked`);
        }
    }

    async assertProfileIsNotBlocking(userProfileId: string, targetProfileId: string) {
        if (await this.isProfileBlockingAnother(targetProfileId, userProfileId)) {
            throw new BlockedError(`You cannot interact with a profile that has blocked you`);
        }
    }

    async assertProfilesDoesNotBlockEachOther(userProfileId: string, targetProfileId: string) {
        await this.assertProfileIsNotBlocked(userProfileId, targetProfileId);
        await this.assertProfileIsNotBlocking(userProfileId, targetProfileId);
    }

    async assertProfilesAreNotSame(sourceProfileId: string, targetProfileId: string) {
        if (sourceProfileId === targetProfileId) {
            throw new SelfInteractionError("A profile cannot interact with itself");
        }
    }
}