import { Repository } from "typeorm";
import { NotFoundError, SelfInteractionError, BlockedError } from "@/app/errors";
import { appDataSource } from "@/database/data-source";
import { ProfileInteraction, ProfileInteractionType } from "@/database/entities/profile-interaction";
import { Profile } from "@/database/entities/profile";

export class FollowProfileHandler {
    constructor(
        private readonly profileInteractionRepository: Repository<ProfileInteraction>,
        private readonly profileRepository: Repository<Profile>
    ) { }

    static get default() {
        return new FollowProfileHandler(
            appDataSource.getRepository(ProfileInteraction),
            appDataSource.getRepository(Profile)
        );
    }

    async handle(followerProfileId: string, followedProfileId: string) {
        // Validations
        if (followerProfileId === followedProfileId) {
            throw new SelfInteractionError("A profile cannot follow itself");
        }

        const followerProfile = await this.profileRepository.findOneBy({ id: followerProfileId });
        if (!followerProfile) {
            throw new NotFoundError(`Follower profile with id ${followerProfileId} not found`);
        }

        const followedProfile = await this.profileRepository.findOneBy({ id: followedProfileId });
        if (!followedProfile) {
            throw new NotFoundError(`Followed profile with id ${followedProfileId} not found`);
        }

        // Check if follower blocked the followed profile
        const followerBlockedFollowed = await this.profileInteractionRepository.findOne({
            where: {
                sourceProfile: { id: followerProfileId },
                targetProfile: { id: followedProfileId },
                interactionType: ProfileInteractionType.Block
            }
        });

        if (followerBlockedFollowed) {
            throw new BlockedError("You cannot follow a profile you have blocked");
        }

        // Check if followed profile blocked the follower
        const followedBlockedFollower = await this.profileInteractionRepository.findOne({
            where: {
                sourceProfile: { id: followedProfileId },
                targetProfile: { id: followerProfileId },
                interactionType: ProfileInteractionType.Block
            }
        });

        if (followedBlockedFollower) {
            throw new BlockedError("You cannot follow a profile that has blocked you");
        }

        const existingFollow = await this.profileInteractionRepository.findOne({
            where: {
                sourceProfile: { id: followerProfileId },
                targetProfile: { id: followedProfileId },
                interactionType: ProfileInteractionType.Follow
            }
        });

        if (existingFollow) {
            return { message: "Profile is already followed", followedAt: existingFollow.createdAt };
        }

        // Creation
        const follow = this.profileInteractionRepository.create({
            sourceProfile: followerProfile,
            targetProfile: followedProfile,
            interactionType: ProfileInteractionType.Follow
        });

        const savedFollow = await this.profileInteractionRepository.save(follow);

        return {
            message: "Profile followed successfully",
            followedAt: savedFollow.createdAt
        };
    }
}
