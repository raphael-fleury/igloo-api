import { Repository } from "typeorm";
import { appDataSource } from "@/database/data-source";
import { Follow } from "@/database/entities/follow";
import { profileDto } from "@/app/dtos/profile.dtos";

export class GetFollowersHandler {
    constructor(private readonly followRepository: Repository<Follow>) { }

    static get default() {
        return new GetFollowersHandler(appDataSource.getRepository(Follow));
    }

    async handle(followedProfileId: string) {
        const follows = await this.followRepository.find({
            where: {
                followedProfile: { id: followedProfileId }
            },
            relations: ["followerProfile"],
            order: {
                createdAt: "DESC"
            }
        });

        return {
            profiles: follows.map(follow => ({
                ...profileDto.parse(follow.followerProfile),
                followedAt: follow.createdAt
            })),
            total: follows.length
        };
    }
}
