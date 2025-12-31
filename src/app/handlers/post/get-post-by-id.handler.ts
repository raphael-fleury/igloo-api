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
            .leftJoinAndSelect("post.repliedPost", "repliedPost")
            .leftJoinAndSelect("repliedPost.profile", "repliedProfile")
            .leftJoinAndSelect("post.quotedPost", "quotedPost")
            .leftJoinAndSelect("quotedPost.profile", "quotedProfile")
            .leftJoin(
                PostInteraction,
                "interaction",
                "interaction.postId = post.id"
            )
            .addSelect([
                `COUNT(CASE WHEN interaction.interactionType = :like THEN 1 END) AS likes`,
                `COUNT(CASE WHEN interaction.interactionType = :repost THEN 1 END) AS reposts`,
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
        console.log(entities, raw);

        if (!entities[0]) {
            throw new NotFoundError(`Post with id ${id} not found`);
        }

        const post = entities[0];
        const metrics = raw[0];

        return postDetailedDto.parse({
            ...post,
            likes: Number(metrics.likes),
            reposts: Number(metrics.reposts),
        });
    }
}
