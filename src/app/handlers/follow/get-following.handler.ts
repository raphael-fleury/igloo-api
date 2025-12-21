import { Repository } from "typeorm";
import { appDataSource } from "@/database/data-source";
import { Follow } from "@/database/entities/follow";
import { profileDto } from "@/app/dtos/profile.dtos";

export class GetFollowingHandler {
    constructor(private readonly followRepository: Repository<Follow>) { }

    static get default() {
        return new GetFollowingHandler(appDataSource.getRepository(Follow));
    }

    async handle(followerProfileId: string) {
        const follows = await this.followRepository.find({
            where: {
                followerProfile: { id: followerProfileId }
            },
            relations: ["followedProfile"],
            order: {
                createdAt: "DESC"
            }
        });

        return {
            profiles: follows.map(follow => ({
                ...profileDto.parse(follow.followedProfile),
                followedAt: follow.createdAt
            })),
            total: follows.length
        };
    }
}
