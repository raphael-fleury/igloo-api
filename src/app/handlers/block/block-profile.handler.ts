import { Repository } from "typeorm";
import { NotFoundError } from "@/app/errors";
import { appDataSource } from "@/database/data-source";
import { ProfileInteraction, ProfileInteractionType } from "@/database/entities/profile-interaction";
import { Profile } from "@/database/entities/profile";

export class BlockProfileHandler {
    constructor(
        private readonly profileInteractionRepository: Repository<ProfileInteraction>,
        private readonly profileRepository: Repository<Profile>
    ) { }

    static get default() {
        return new BlockProfileHandler(
            appDataSource.getRepository(ProfileInteraction),
            appDataSource.getRepository(Profile)
        );
    }

    async handle(blockerProfileId: string, blockedProfileId: string) {
        // Validations
        const blockerProfile = await this.profileRepository.findOneBy({ id: blockerProfileId });
        if (!blockerProfile) {
            throw new NotFoundError(`Blocker profile with id ${blockerProfileId} not found`);
        }

        const blockedProfile = await this.profileRepository.findOneBy({ id: blockedProfileId });
        if (!blockedProfile) {
            throw new NotFoundError(`Blocked profile with id ${blockedProfileId} not found`);
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

        // Remove follows in both directions
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

        // Creation
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