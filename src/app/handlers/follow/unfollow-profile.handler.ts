import { Repository } from "typeorm";
import { ConflictError } from "@/app/errors";
import { appDataSource } from "@/database/data-source";
import { ProfileInteraction, ProfileInteractionType } from "@/database/entities/profile-interaction";

export class UnfollowProfileHandler {
    constructor(private readonly profileInteractionRepository: Repository<ProfileInteraction>) { }

    static get default() {
        return new UnfollowProfileHandler(appDataSource.getRepository(ProfileInteraction));
    }

    async handle(followerProfileId: string, followedProfileId: string) {
        // Find the existing follow
        const follow = await this.profileInteractionRepository.findOne({
            where: {
                sourceProfile: { id: followerProfileId },
                targetProfile: { id: followedProfileId },
                interactionType: ProfileInteractionType.Follow
            }
        });

        if (!follow) {
            throw new ConflictError(`Follow between profiles not found`);
        }

        // Remove the follow
        await this.profileInteractionRepository.remove(follow);

        return {
            message: "Profile unfollowed successfully",
            unfollowedAt: new Date()
        };
    }
}
