import { Repository } from "typeorm";
import { appDataSource } from "@/database/data-source";
import { Post } from "@/database/entities/post";
import { postDetailedDto, PostQueryDto, postsPageDto } from "@/app/dtos/post.dtos";
import { InteractionType, PostInteraction } from "@/database/entities/post-interaction";

export class FindPostsHandler {
    constructor(private readonly postRepository: Repository<Post>) { }

    static get default() {
        return new FindPostsHandler(appDataSource.getRepository(Post));
    }

    async handle(query: PostQueryDto) {
        const qb = this.postRepository
            .createQueryBuilder("post")
            .leftJoinAndSelect("post.profile", "profile")

            // Replied post + profile
            .leftJoinAndSelect("post.repliedPost", "repliedPost")
            .leftJoinAndSelect("repliedPost.profile", "repliedProfile")

            // Quoted post + profile
            .leftJoinAndSelect("post.quotedPost", "quotedPost")
            .leftJoinAndSelect("quotedPost.profile", "quotedProfile")

            // Replies count
            .addSelect(subQuery => {
                return subQuery
                    .select("COUNT(*)")
                    .from(Post, "p")
                    .where("p.replied_post_id = post.id");
            }, "replies")

            // Quotes count
            .addSelect(subQuery => {
                return subQuery
                    .select("COUNT(*)")
                    .from(Post, "p")
                    .where("p.quoted_post_id = post.id");
            }, "quotes")

            // Likes count
            .addSelect(subQuery => {
                return subQuery
                    .select("COUNT(*)")
                    .from(PostInteraction, "i")
                    .where("i.post_id = post.id")
                    .andWhere("i.interaction_type = :like");
            }, "likes")

            // Reposts count
            .addSelect(subQuery => {
                return subQuery
                    .select("COUNT(*)")
                    .from(PostInteraction, "i")
                    .where("i.post_id = post.id")
                    .andWhere("i.interaction_type = :repost");
            }, "reposts")

            .setParameters({
                like: InteractionType.Like,
                repost: InteractionType.Repost,
            })

            .orderBy("post.createdAt", "DESC")
            .take(query.limit + 1);

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
        const hasNextPage = entities.length > query.limit;

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
