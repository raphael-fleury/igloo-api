import { Repository } from "typeorm";
import { appDataSource } from "@/database/data-source";
import { PostInteraction, InteractionType } from "@/database/entities/post-interaction";
import { RepostsDto, profileDto } from "@/app/dtos/profile.dtos";
import { CommandHandler } from "@/app/cqrs";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

interface GetPostRepostsQuery {
    postId: string;
    cursor?: string;
    limit?: number;
}

export class GetPostRepostsHandler implements CommandHandler<GetPostRepostsQuery, RepostsDto> {
    constructor(private readonly postInteractionRepository: Repository<PostInteraction>) { }

    static get default() {
        return new GetPostRepostsHandler(appDataSource.getRepository(PostInteraction));
    }

    async handle({ postId, cursor, limit }: GetPostRepostsQuery) {
        const pageLimit = Math.min(MAX_LIMIT, limit ?? DEFAULT_LIMIT);

        const qb = this.postInteractionRepository
            .createQueryBuilder("interaction")
            .leftJoinAndSelect("interaction.profile", "profile")
            .where("interaction.post.id = :postId", { postId })
            .andWhere("interaction.interactionType = :type", { type: InteractionType.Repost })
            .orderBy("interaction.id", "DESC")
            .take(pageLimit + 1);

        if (cursor) {
            qb.andWhere("interaction.id < :cursor", { cursor });
        }

        const reposts = await qb.getMany();
        const hasNextPage = reposts.length > pageLimit;

        if (hasNextPage) {
            reposts.pop();
        }

        return {
            items: reposts.map(repost => ({
                ...profileDto.parse(repost.profile),
                repostedAt: repost.createdAt
            })),
            count: reposts.length,
            hasNextPage,
            nextCursor: hasNextPage ? reposts[reposts.length - 1].id : undefined
        };
    }
}
