import { Repository } from "typeorm";
import { postDetailedDto, PostDetailedDto } from "@/app/dtos/post.dtos";
import { NotFoundError } from "@/app/errors";
import { appDataSource } from "@/database/data-source";
import { Post } from "@/database/entities/post";
import { countPostLikes, countPostQuotes, countPostReplies, countPostReposts } from "@/database/queries/post.queries";
import { CommandHandler } from "@/app/cqrs";

export class GetPostByIdHandler implements CommandHandler<string, PostDetailedDto> {
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

            .where("post.id = :id", { id })

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
