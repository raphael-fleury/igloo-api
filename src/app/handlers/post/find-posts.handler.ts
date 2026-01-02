import { Repository } from "typeorm";
import { appDataSource } from "@/database/data-source";
import { Post } from "@/database/entities/post";
import { postDetailedDto, PostQueryDto } from "@/app/dtos/post.dtos";
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

            // Quotes and Replies
            .leftJoin(Post, "reply", "reply.replied_post_id = post.id")
            .leftJoin(Post, "quote", "quote.quoted_post_id = post.id")

            // Quoted & Replied posts + profiles
            .leftJoinAndSelect("post.repliedPost", "repliedPost")
            .leftJoinAndSelect("repliedPost.profile", "repliedProfile")
            .leftJoinAndSelect("post.quotedPost", "quotedPost")
            .leftJoinAndSelect("quotedPost.profile", "quotedProfile")

            // Interactions
            .leftJoin(PostInteraction, "interaction", "interaction.post_id = post.id")

            .addSelect([
                `COUNT(DISTINCT reply.id) AS replies`,
                `COUNT(DISTINCT quote.id) AS quotes`,
                `COUNT(DISTINCT CASE WHEN interaction.interaction_type = 'like' THEN interaction.id END) AS likes`,
                `COUNT(DISTINCT CASE WHEN interaction.interaction_type = 'repost' THEN interaction.id END) AS reposts`,
            ])
            .setParameters({
                like: InteractionType.Like,
                repost: InteractionType.Repost,
            })

            .groupBy("post.id")
            .addGroupBy("profile.id")
            .addGroupBy("repliedPost.id")
            .addGroupBy("repliedProfile.id")
            .addGroupBy("quotedPost.id")
            .addGroupBy("quotedProfile.id")

            .orderBy("post.createdAt", "DESC");

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

        const { entities, raw } = await qb.getRawAndEntities();

        return entities.map((post, i) =>
            postDetailedDto.parse({
                ...post,
                likes: Number(raw[i].likes),
                reposts: Number(raw[i].reposts),
                replies: Number(raw[i].replies),
                quotes: Number(raw[i].quotes),
            })
        );
    }
}
