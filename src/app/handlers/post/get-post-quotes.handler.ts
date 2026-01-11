import { Repository } from "typeorm";
import { appDataSource } from "@/database/data-source";
import { Post } from "@/database/entities/post";
import { postDetailedDto, postsPageDto, PostsPageDto } from "@/app/dtos/post.dtos";
import { findPostQuotes } from "@/database/queries/post.queries";
import { PageQueryDto } from "@/app/dtos/common.dtos";
import { CommandHandler } from "@/app/cqrs";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 20;

interface GetPostQuotesQuery {
    postId: string;
    cursor?: string;
    limit?: number;
}

export class GetPostQuotesHandler implements CommandHandler<GetPostQuotesQuery, PostsPageDto> {
    constructor(private readonly postRepository: Repository<Post>) { }

    static get default() {
        return new GetPostQuotesHandler(appDataSource.getRepository(Post));
    }

    async handle(command: GetPostQuotesQuery) {
        const limit = Math.min(MAX_LIMIT, command.limit ?? DEFAULT_LIMIT);

        const query: PageQueryDto = {
            cursor: command.cursor,
            limit: command.limit
        };

        const qb = this.postRepository
            .createQueryBuilder("post")
            .apply(findPostQuotes(command.postId, query))
            .take(limit + 1);

        const { entities, raw } = await qb.getRawAndEntities();
        const hasNextPage = entities.length > limit;

        if (hasNextPage) {
            entities.pop();
            raw.pop();
        }

        return postsPageDto.parse({
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
        });
    }
}

