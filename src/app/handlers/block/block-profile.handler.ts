import { Repository } from "typeorm";
import { appDataSource } from "@/database/data-source";
import { ProfileInteraction, ProfileInteractionType } from "@/database/entities/profile-interaction";
import { InteractionValidator } from "@/app/validators/interaction.validator";
import { ConflictError } from "@/app/errors";
import { CommandHandler } from "@/app/cqrs";

type BlockProfileCommand = {
    sourceProfileId: string
    targetProfileId: string
}

export class BlockProfileHandler implements CommandHandler<BlockProfileCommand, void> {
    constructor(
        private readonly profileInteractionRepository: Repository<ProfileInteraction>,
        private readonly interactionValidator: InteractionValidator
    ) { }

    static get default() {
        return new BlockProfileHandler(
            appDataSource.getRepository(ProfileInteraction),
            InteractionValidator.default
        );
    }

    async handle({ sourceProfileId, targetProfileId }: BlockProfileCommand) {
        const sourceProfile = await this.interactionValidator.assertProfileExists(sourceProfileId);
        const targetProfile = await this.interactionValidator.assertProfileExists(targetProfileId);

        const followerFollow = await this.profileInteractionRepository.findOne({
            where: {
                sourceProfile: { id: sourceProfileId },
                targetProfile: { id: targetProfileId },
                interactionType: ProfileInteractionType.Follow
            }
        });

        if (followerFollow) {
            await this.profileInteractionRepository.remove(followerFollow);
        }

        const followedByFollow = await this.profileInteractionRepository.findOne({
            where: {
                sourceProfile: { id: targetProfileId },
                targetProfile: { id: sourceProfileId },
                interactionType: ProfileInteractionType.Follow
            }
        });

        if (followedByFollow) {
            await this.profileInteractionRepository.remove(followedByFollow);
        }

        const existingBlock = await this.profileInteractionRepository.findOne({
            where: {
                sourceProfile: { id: sourceProfileId },
                targetProfile: { id: targetProfileId },
                interactionType: ProfileInteractionType.Block
            }
        });

        if (existingBlock) {
            throw new ConflictError("Profile is already blocked");
        }

        const block = this.profileInteractionRepository.create({
            sourceProfile: sourceProfile,
            targetProfile: targetProfile,
            interactionType: ProfileInteractionType.Block
        });

        await this.profileInteractionRepository.save(block);
    }
}
