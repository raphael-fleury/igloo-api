import { Repository } from "typeorm";
import { appDataSource } from "@/database/data-source";
import { Post } from "@/database/entities/post";
import { postDetailedDto, PostsPageDto } from "@/app/dtos/post.dtos";
import { findPostReplies } from "@/database/queries/post.queries";
import { CommandHandler } from "@/app/cqrs";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 20;

export type GetPostRepliesQuery = {
    postId: string;
    limit?: number;
    cursor?: string;
}

export class GetPostRepliesHandler implements CommandHandler<GetPostRepliesQuery, PostsPageDto> {
    constructor(private readonly postRepository: Repository<Post>) { }

    static get default() {
        return new GetPostRepliesHandler(appDataSource.getRepository(Post));
    }

    async handle(query: GetPostRepliesQuery) {
        const limit = Math.min(MAX_LIMIT, query.limit ?? DEFAULT_LIMIT);

        const qb = this.postRepository
            .createQueryBuilder("post")
            .apply(findPostReplies(query.postId, query.cursor))
            .take(limit + 1);

        const { entities, raw } = await qb.getRawAndEntities();
        const hasNextPage = entities.length > limit;

        if (hasNextPage) {
            entities.pop();
            raw.pop();
        }

        return {
            hasNextPage,
            nextCursor: hasNextPage ? entities[entities.length - 1].id : undefined,
            count: entities.length,
            items: entities.map((post, i) =>
                postDetailedDto.parse({
                    ...post,
                    likes: Number(raw[i].likes),
                    reposts: Number(raw[i].reposts),
                    replies: Number(raw[i].replies),
                    quotes: Number(raw[i].quotes),
                })
            ),
        };
    }
}
