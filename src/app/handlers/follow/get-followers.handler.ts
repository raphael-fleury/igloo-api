import { Repository } from "typeorm";
import { appDataSource } from "@/database/data-source";
import { ProfileInteraction, ProfileInteractionType } from "@/database/entities/profile-interaction";
import { FollowsDto, profileDto } from "@/app/dtos/profile.dtos";
import { CommandHandler } from "@/app/cqrs";
import { TargetProfileDto } from "@/app/dtos/post-interaction.dto";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

export class GetFollowersHandler implements CommandHandler<TargetProfileDto, FollowsDto> {
    constructor(private readonly profileInteractionRepository: Repository<ProfileInteraction>) { }

    static get default() {
        return new GetFollowersHandler(appDataSource.getRepository(ProfileInteraction));
    }

    async handle({ targetProfileId, cursor, limit }: TargetProfileDto) {
        const pageLimit = Math.min(MAX_LIMIT, limit ?? DEFAULT_LIMIT);

        const qb = this.profileInteractionRepository
            .createQueryBuilder("interaction")
            .leftJoinAndSelect("interaction.sourceProfile", "profile")
            .where("interaction.targetProfile.id = :targetProfileId", { targetProfileId })
            .andWhere("interaction.interactionType = :type", { type: ProfileInteractionType.Follow })
            .orderBy("interaction.id", "DESC")
            .take(pageLimit + 1);

        if (cursor) {
            qb.andWhere("interaction.id < :cursor", { cursor });
        }

        const follows = await qb.getMany();
        const hasNextPage = follows.length > pageLimit;

        if (hasNextPage) {
            follows.pop();
        }

        return {
            items: follows.map(follow => ({
                ...profileDto.parse(follow.sourceProfile),
                followedAt: follow.createdAt
            })),
            count: follows.length,
            hasNextPage,
            nextCursor: hasNextPage ? follows[follows.length - 1].id : undefined
        };
    }
}
