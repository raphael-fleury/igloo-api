import { Repository } from "typeorm";
import { appDataSource } from "@/database/data-source";
import { PostInteraction, InteractionType } from "@/database/entities/post-interaction";
import { LikesDto, profileDto } from "@/app/dtos/profile.dtos";
import { CommandHandler } from "@/app/cqrs";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

interface GetPostLikesQuery {
    postId: string;
    cursor?: string;
    limit?: number;
}

export class GetPostLikesHandler implements CommandHandler<GetPostLikesQuery, LikesDto> {
    constructor(private readonly postInteractionRepository: Repository<PostInteraction>) { }

    static get default() {
        return new GetPostLikesHandler(appDataSource.getRepository(PostInteraction));
    }

    async handle({ postId, cursor, limit }: GetPostLikesQuery) {
        const pageLimit = Math.min(MAX_LIMIT, limit ?? DEFAULT_LIMIT);

        const qb = this.postInteractionRepository
            .createQueryBuilder("interaction")
            .leftJoinAndSelect("interaction.profile", "profile")
            .where("interaction.post.id = :postId", { postId })
            .andWhere("interaction.interactionType = :type", { type: InteractionType.Like })
            .orderBy("interaction.id", "DESC")
            .take(pageLimit + 1);

        if (cursor) {
            qb.andWhere("interaction.id < :cursor", { cursor });
        }

        const likes = await qb.getMany();
        const hasNextPage = likes.length > pageLimit;

        if (hasNextPage) {
            likes.pop();
        }

        return {
            items: likes.map(like => ({
                ...profileDto.parse(like.profile),
                likedAt: like.createdAt
            })),
            count: likes.length,
            hasNextPage,
            nextCursor: hasNextPage ? likes[likes.length - 1].id : undefined
        };
    }
}

