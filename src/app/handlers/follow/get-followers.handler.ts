import { Repository } from "typeorm";
import { appDataSource } from "@/database/data-source";
import { ProfileInteraction, ProfileInteractionType } from "@/database/entities/profile-interaction";
import { profileDto } from "@/app/dtos/profile.dtos";

export class GetFollowersHandler {
    constructor(private readonly profileInteractionRepository: Repository<ProfileInteraction>) { }

    static get default() {
        return new GetFollowersHandler(appDataSource.getRepository(ProfileInteraction));
    }

    async handle(followedProfileId: string) {
        const follows = await this.profileInteractionRepository.find({
            where: {
                targetProfile: { id: followedProfileId },
                interactionType: ProfileInteractionType.Follow
            },
            relations: ["sourceProfile"],
            order: {
                createdAt: "DESC"
            }
        });

        return {
            profiles: follows.map(follow => ({
                ...profileDto.parse(follow.sourceProfile),
                followedAt: follow.createdAt
            })),
            total: follows.length
        };
    }
}
