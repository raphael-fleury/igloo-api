import { Repository } from "typeorm";
import { NotFoundError } from "@/app/errors";
import { appDataSource } from "@/database/data-source";
import { Follow } from "@/database/entities/follow";

export class UnfollowProfileHandler {
    constructor(private readonly followRepository: Repository<Follow>) { }

    static get default() {
        return new UnfollowProfileHandler(appDataSource.getRepository(Follow));
    }

    async handle(followerProfileId: string, followedProfileId: string) {
        // Find the existing follow
        const follow = await this.followRepository.findOne({
            where: {
                followerProfile: { id: followerProfileId },
                followedProfile: { id: followedProfileId }
            }
        });

        if (!follow) {
            throw new NotFoundError(`Follow between profiles not found`);
        }

        // Remove the follow
        await this.followRepository.remove(follow);

        return {
            message: "Profile unfollowed successfully",
            unfollowedAt: new Date()
        };
    }
}
