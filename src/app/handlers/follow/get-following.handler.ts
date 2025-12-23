import { Repository } from "typeorm";
import { appDataSource } from "@/database/data-source";
import { ProfileInteraction, ProfileInteractionType } from "@/database/entities/profile-interaction";
import { profileDto } from "@/app/dtos/profile.dtos";

export class GetFollowingHandler {
    constructor(private readonly profileInteractionRepository: Repository<ProfileInteraction>) { }

    static get default() {
        return new GetFollowingHandler(appDataSource.getRepository(ProfileInteraction));
    }

    async handle(followerProfileId: string) {
        const follows = await this.profileInteractionRepository.find({
            where: {
                sourceProfile: { id: followerProfileId },
                interactionType: ProfileInteractionType.Follow
            },
            relations: ["targetProfile"],
            order: {
                createdAt: "DESC"
            }
        });

        return {
            profiles: follows.map(follow => ({
                ...profileDto.parse(follow.targetProfile),
                followedAt: follow.createdAt
            })),
            total: follows.length
        };
    }
}
