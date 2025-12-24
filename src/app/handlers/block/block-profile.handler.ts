import { Repository } from "typeorm";
import { appDataSource } from "@/database/data-source";
import { ProfileInteraction, ProfileInteractionType } from "@/database/entities/profile-interaction";
import { InteractionValidator } from "@/app/validators/interaction.validator";

export class BlockProfileHandler {
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

    async handle(blockerProfileId: string, blockedProfileId: string) {
        const blockerProfile = await this.interactionValidator.assertProfileExists(blockerProfileId);
        const blockedProfile = await this.interactionValidator.assertProfileExists(blockedProfileId);

        const followerFollow = await this.profileInteractionRepository.findOne({
            where: {
                sourceProfile: { id: blockerProfileId },
                targetProfile: { id: blockedProfileId },
                interactionType: ProfileInteractionType.Follow
            }
        });

        if (followerFollow) {
            await this.profileInteractionRepository.remove(followerFollow);
        }

        const followedByFollow = await this.profileInteractionRepository.findOne({
            where: {
                sourceProfile: { id: blockedProfileId },
                targetProfile: { id: blockerProfileId },
                interactionType: ProfileInteractionType.Follow
            }
        });

        if (followedByFollow) {
            await this.profileInteractionRepository.remove(followedByFollow);
        }

        const existingBlock = await this.profileInteractionRepository.findOne({
            where: {
                sourceProfile: { id: blockerProfileId },
                targetProfile: { id: blockedProfileId },
                interactionType: ProfileInteractionType.Block
            }
        });

        if (existingBlock) {
            return { message: "Profile is already blocked", blockedAt: existingBlock.createdAt };
        }

        const block = this.profileInteractionRepository.create({
            sourceProfile: blockerProfile,
            targetProfile: blockedProfile,
            interactionType: ProfileInteractionType.Block
        });

        const savedBlock = await this.profileInteractionRepository.save(block);

        return {
            message: "Profile blocked successfully",
            blockedAt: savedBlock.createdAt
        };
    }
}
