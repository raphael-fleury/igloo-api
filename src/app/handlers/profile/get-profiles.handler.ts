import { Repository } from "typeorm";
import { profileDto, ProfilesPageDto } from "@/app/dtos/profile.dtos";
import { appDataSource } from "@/database/data-source";
import { Profile } from "@/database/entities/profile";
import { PageQueryDto } from "@/app/dtos/common.dtos";
import { CommandHandler } from "@/app/cqrs";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

export class GetProfilesHandler implements CommandHandler<PageQueryDto, ProfilesPageDto> {
    constructor(private readonly profileRepository: Repository<Profile>) { }

    static get default() {
        return new GetProfilesHandler(appDataSource.getRepository(Profile));
    }

    async handle(query: PageQueryDto): Promise<ProfilesPageDto> {
        const pageLimit = Math.min(MAX_LIMIT, query.limit ?? DEFAULT_LIMIT);

        const qb = this.profileRepository
            .createQueryBuilder("profile")
            .orderBy("profile.id", "DESC")
            .take(pageLimit + 1);

        if (query.cursor) {
            qb.andWhere("profile.id < :cursor", { cursor: query.cursor });
        }

        const profiles = await qb.getMany();
        const hasNextPage = profiles.length > pageLimit;

        if (hasNextPage) {
            profiles.pop();
        }

        return {
            items: profiles.map(p => profileDto.parse(p)),
            count: profiles.length,
            hasNextPage,
            nextCursor: hasNextPage ? profiles[profiles.length - 1].id : undefined
        };
    }
}
