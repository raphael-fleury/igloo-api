import { Repository } from "typeorm";
import { appDataSource } from "@/database/data-source";
import { Post } from "@/database/entities/post";
import { postDetailedDto, PostQueryDto, postsPageDto, PostsPageDto } from "@/app/dtos/post.dtos";
import { findPosts } from "@/database/queries/post.queries";
import { CommandHandler } from "@/app/cqrs";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 20;

export class FindPostsHandler implements CommandHandler<PostQueryDto, PostsPageDto> {
    constructor(private readonly postRepository: Repository<Post>) { }

    static get default() {
        return new FindPostsHandler(appDataSource.getRepository(Post));
    }

    async handle(query: PostQueryDto) {
        const limit = Math.min(MAX_LIMIT, query.limit ?? DEFAULT_LIMIT);

        const qb = this.postRepository
            .createQueryBuilder("post")
            .apply(findPosts(query))
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
