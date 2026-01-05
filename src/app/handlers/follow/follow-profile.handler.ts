import { Repository } from "typeorm";
import { appDataSource } from "@/database/data-source";
import { ProfileInteraction, ProfileInteractionType } from "@/database/entities/profile-interaction";
import { InteractionValidator } from "@/app/validators/interaction.validator";
import { ConflictError } from "@/app/errors";
import { CommandHandler } from "@/app/cqrs";

type FollowProfileCommand = {
    sourceProfileId: string;
    targetProfileId: string;
}

export class FollowProfileHandler implements CommandHandler<FollowProfileCommand, void> {
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

    async handle({ sourceProfileId, targetProfileId }: FollowProfileCommand) {
        // Validations
        await this.interactionValidator.assertProfilesAreNotSame(sourceProfileId, targetProfileId);
        await this.interactionValidator.assertProfilesDoesNotBlockEachOther(sourceProfileId, targetProfileId);

        const sourceProfile = await this.interactionValidator.assertProfileExists(sourceProfileId);
        const targetProfile = await this.interactionValidator.assertProfileExists(targetProfileId);

        const existingFollow = await this.profileInteractionRepository.findOne({
            where: {
                sourceProfile: { id: sourceProfileId },
                targetProfile: { id: targetProfileId },
                interactionType: ProfileInteractionType.Follow
            }
        });

        if (existingFollow) {
            throw new ConflictError("Profile is already followed");
        }

        // Creation
        const follow = this.profileInteractionRepository.create({
            sourceProfile: sourceProfile,
            targetProfile: targetProfile,
            interactionType: ProfileInteractionType.Follow
        });

        await this.profileInteractionRepository.save(follow);
    }
}
