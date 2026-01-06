import { Repository } from "typeorm";
import { appDataSource } from "@/database/data-source";
import { ProfileInteraction, ProfileInteractionType } from "@/database/entities/profile-interaction";
import { profileDto, MutedProfilesDto } from "@/app/dtos/profile.dtos";
import { CommandHandler } from "@/app/cqrs";
import { SourceProfileDto } from "@/app/dtos/post-interaction.dto";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

export class GetMutedProfilesHandler implements CommandHandler<SourceProfileDto, MutedProfilesDto> {
    constructor(private readonly profileInteractionRepository: Repository<ProfileInteraction>) { }

    static get default() {
        return new GetMutedProfilesHandler(appDataSource.getRepository(ProfileInteraction));
    }

    async handle({ sourceProfileId, cursor, limit }: SourceProfileDto) {
        const pageLimit = Math.min(MAX_LIMIT, limit ?? DEFAULT_LIMIT);

        const qb = this.profileInteractionRepository
            .createQueryBuilder("interaction")
            .leftJoinAndSelect("interaction.targetProfile", "profile")
            .where("interaction.sourceProfile.id = :sourceProfileId", { sourceProfileId })
            .andWhere("interaction.interactionType = :type", { type: ProfileInteractionType.Mute })
            .orderBy("interaction.id", "DESC")
            .take(pageLimit + 1);

        if (cursor) {
            qb.andWhere("interaction.id < :cursor", { cursor });
        }

        const mutes = await qb.getMany();
        const hasNextPage = mutes.length > pageLimit;

        if (hasNextPage) {
            mutes.pop();
        }

        return {
            items: mutes.map(mute => ({
                ...profileDto.parse(mute.targetProfile),
                mutedAt: mute.createdAt
            })),
            count: mutes.length,
            hasNextPage,
            nextCursor: hasNextPage ? mutes[mutes.length - 1].id : undefined
        };
    }
}
