import { Repository } from "typeorm";
import { NotFoundError, SelfInteractionError, BlockedError } from "@/app/errors";
import { appDataSource } from "@/database/data-source";
import { Follow } from "@/database/entities/follow";
import { Profile } from "@/database/entities/profile";
import { Block } from "@/database/entities/block";

export class FollowProfileHandler {
    constructor(
        private readonly followRepository: Repository<Follow>,
        private readonly profileRepository: Repository<Profile>,
        private readonly blockRepository: Repository<Block>
    ) { }

    static get default() {
        return new FollowProfileHandler(
            appDataSource.getRepository(Follow),
            appDataSource.getRepository(Profile),
            appDataSource.getRepository(Block)
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
        const followerBlockedFollowed = await this.blockRepository.findOne({
            where: {
                blockerProfile: { id: followerProfileId },
                blockedProfile: { id: followedProfileId }
            }
        });

        if (followerBlockedFollowed) {
            throw new BlockedError("You cannot follow a profile you have blocked");
        }

        // Check if followed profile blocked the follower
        const followedBlockedFollower = await this.blockRepository.findOne({
            where: {
                blockerProfile: { id: followedProfileId },
                blockedProfile: { id: followerProfileId }
            }
        });

        if (followedBlockedFollower) {
            throw new BlockedError("You cannot follow a profile that has blocked you");
        }

        const existingFollow = await this.followRepository.findOne({
            where: {
                followerProfile: { id: followerProfileId },
                followedProfile: { id: followedProfileId }
            }
        });

        if (existingFollow) {
            return { message: "Profile is already followed", followedAt: existingFollow.createdAt };
        }

        // Creation
        const follow = this.followRepository.create({
            followerProfile,
            followedProfile
        });

        const savedFollow = await this.followRepository.save(follow);

        return {
            message: "Profile followed successfully",
            followedAt: savedFollow.createdAt
        };
    }
}
