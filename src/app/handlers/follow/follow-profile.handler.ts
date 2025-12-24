import { Repository } from "typeorm";
import { appDataSource } from "@/database/data-source";
import { ProfileInteraction, ProfileInteractionType } from "@/database/entities/profile-interaction";
import { InteractionValidator } from "@/app/validators/interaction.validator";
import { ConflictError } from "@/app/errors";

export class FollowProfileHandler {
    constructor(
        private readonly profileInteractionRepository: Repository<ProfileInteraction>,
        private readonly interactionValidator: InteractionValidator
    ) { }

    static get default() {
        return new FollowProfileHandler(
            appDataSource.getRepository(ProfileInteraction),
            InteractionValidator.default
        );
    }

    async handle(followerProfileId: string, followedProfileId: string) {
        // Validations
        await this.interactionValidator.assertProfilesAreNotSame(followerProfileId, followedProfileId);
        await this.interactionValidator.assertProfilesDoesNotBlockEachOther(followerProfileId, followedProfileId);

        const followerProfile = await this.interactionValidator.assertProfileExists(followerProfileId);
        const followedProfile = await this.interactionValidator.assertProfileExists(followedProfileId);

        const existingFollow = await this.profileInteractionRepository.findOne({
            where: {
                sourceProfile: { id: followerProfileId },
                targetProfile: { id: followedProfileId },
                interactionType: ProfileInteractionType.Follow
            }
        });

        if (existingFollow) {
            throw new ConflictError("Profile is already followed");
        }

        // Creation
        const follow = this.profileInteractionRepository.create({
            sourceProfile: followerProfile,
            targetProfile: followedProfile,
            interactionType: ProfileInteractionType.Follow
        });

        await this.profileInteractionRepository.save(follow);
    }
}
