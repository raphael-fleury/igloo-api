import { Repository } from "typeorm";
import { postDetailedDto } from "@/app/dtos/post.dtos";
import { NotFoundError } from "@/app/errors";
import { appDataSource } from "@/database/data-source";
import { Post } from "@/database/entities/post";
import { PostInteraction, InteractionType } from "@/database/entities/post-interaction";

export class GetPostByIdHandler {
    constructor(
        private readonly postRepository: Repository<Post>
    ) { }

    static get default() {
        return new GetPostByIdHandler(
            appDataSource.getRepository(Post)
        );
    }

    async handle(id: string) {
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
                `COUNT(DISTINCT CASE WHEN interaction.interaction_type = :like THEN interaction.id END) AS likes`,
                `COUNT(DISTINCT CASE WHEN interaction.interaction_type = :repost THEN interaction.id END) AS reposts`,
            ])

            .where("post.id = :id", { id })
            .setParameters({
                like: InteractionType.Like,
                repost: InteractionType.Repost,
            })

            .groupBy("post.id")
            .addGroupBy("profile.id")
            .addGroupBy("repliedPost.id")
            .addGroupBy("repliedProfile.id")
            .addGroupBy("quotedPost.id")
            .addGroupBy("quotedProfile.id");

        const { entities, raw } = await qb.getRawAndEntities();

        if (!entities[0]) {
            throw new NotFoundError(`Post with id ${id} not found`);
        }

        const post = entities[0];
        const metrics = raw[0];

        return postDetailedDto.parse({
            ...post,
            likes: Number(metrics.likes),
            reposts: Number(metrics.reposts),
            replies: Number(metrics.replies),
            quotes: Number(metrics.quotes),
        });
    }
}
