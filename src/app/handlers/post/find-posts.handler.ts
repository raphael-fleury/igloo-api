import { Repository } from "typeorm";
import { appDataSource } from "@/database/data-source";
import { Post } from "@/database/entities/post";
import { postDetailedDto, PostQueryDto, postsPageDto, PostsPageDto } from "@/app/dtos/post.dtos";
import { countPostLikes, countPostQuotes, countPostReplies, countPostReposts } from "@/database/queries/post.queries";
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
            .leftJoinAndSelect("post.profile", "profile")

            // Replied post + profile
            .leftJoinAndSelect("post.repliedPost", "repliedPost")
            .leftJoinAndSelect("repliedPost.profile", "repliedProfile")

            // Quoted post + profile
            .leftJoinAndSelect("post.quotedPost", "quotedPost")
            .leftJoinAndSelect("quotedPost.profile", "quotedProfile")

            // Replies & Quotes count
            .addSelect(countPostReplies, "replies")
            .addSelect(countPostQuotes, "quotes")
            .addSelect(countPostLikes, "likes")
            .addSelect(countPostReposts, "reposts")

            .orderBy("post.id", "DESC")
            .take(limit + 1);

        if (query.content) {
            qb.andWhere("post.content ILIKE :content", { content: `%${query.content}%` });
        }

        if (query.from) {
            qb.andWhere("profile.username = :from", { from: query.from });
        }

        if (query.since) {
            qb.andWhere("post.created_at >= :since", { since: query.since });
        }

        if (query.until) {
            qb.andWhere("post.created_at <= :until", { until: query.until });
        }

        if (query.repliedPostId) {
            qb.andWhere("repliedPost.id = :repliedPostId", { repliedPostId: query.repliedPostId });
        }

        if (query.repliedProfileUsername) {
            qb.andWhere("repliedProfile.username = :repliedProfileUsername", {
                repliedProfileUsername: query.repliedProfileUsername
            });
        }

        if (query.quotedPostId) {
            qb.andWhere("quotedPost.id = :quotedPostId", { quotedPostId: query.quotedPostId });
        }

        if (query.quotedProfileUsername) {
            qb.andWhere("quotedProfile.username = :quotedProfileUsername", {
                quotedProfileUsername: query.quotedProfileUsername
            });
        }

        if (query.cursor) {
            qb.andWhere("post.id < :cursor", { cursor: query.cursor });
        }

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
