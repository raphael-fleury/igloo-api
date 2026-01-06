import { Repository } from "typeorm";
import { appDataSource } from "@/database/data-source";
import { ProfileInteraction, ProfileInteractionType } from "@/database/entities/profile-interaction";
import { BlockedProfilesDto, profileDto } from "@/app/dtos/profile.dtos";
import { CommandHandler } from "@/app/cqrs";
import { SourceProfileDto } from "@/app/dtos/post-interaction.dto";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

export class GetBlockedProfilesHandler implements CommandHandler<SourceProfileDto, BlockedProfilesDto> {
    constructor(private readonly profileInteractionRepository: Repository<ProfileInteraction>) { }

    static get default() {
        return new GetBlockedProfilesHandler(appDataSource.getRepository(ProfileInteraction));
    }

    async handle({ sourceProfileId, cursor, limit }: SourceProfileDto) {
        const pageLimit = Math.min(MAX_LIMIT, limit ?? DEFAULT_LIMIT);

        const qb = this.profileInteractionRepository
            .createQueryBuilder("interaction")
            .leftJoinAndSelect("interaction.targetProfile", "profile")
            .where("interaction.sourceProfile.id = :sourceProfileId", { sourceProfileId })
            .andWhere("interaction.interactionType = :type", { type: ProfileInteractionType.Block })
            .orderBy("interaction.id", "DESC")
            .take(pageLimit + 1);

        if (cursor) {
            qb.andWhere("interaction.id < :cursor", { cursor });
        }

        const blocks = await qb.getMany();
        const hasNextPage = blocks.length > pageLimit;

        if (hasNextPage) {
            blocks.pop();
        }

        return {
            items: blocks.map(block => ({
                ...profileDto.parse(block.targetProfile),
                blockedAt: block.createdAt
            })),
            count: blocks.length,
            hasNextPage,
            nextCursor: hasNextPage ? blocks[blocks.length - 1].id : undefined
        };
    }
}
