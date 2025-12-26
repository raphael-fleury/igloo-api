import { Between, FindOptionsWhere, LessThanOrEqual, Like, MoreThanOrEqual, Repository } from "typeorm";
import { appDataSource } from "@/database/data-source";
import { Post } from "@/database/entities/post";
import { PostQueryDto, postDto } from "@/app/dtos/post.dtos";

export class FindPostsHandler {
    constructor(private readonly postRepository: Repository<Post>) { }

    static get default() {
        return new FindPostsHandler(appDataSource.getRepository(Post));
    }

    async handle(query: PostQueryDto) {
        const where: FindOptionsWhere<Post> = {};

        if (query.content) {
            where.content = Like(`%${query.content}%`);
        }
        if (query.from) {
            where.profile = { username: query.from };
        }
        if (query.since && query.until) {
            where.createdAt = Between(query.since, query.until);
        } else {
            if (query.since) {
                where.createdAt = MoreThanOrEqual(query.since);
            }
            if (query.until) {
                where.createdAt = LessThanOrEqual(query.until);
            }
        }
        if (query.repliedPostId || query.repliedProfileUsername) {
            where.repliedPost = {};

            if (query.repliedPostId) {
                where.repliedPost.id = query.repliedPostId;
            }

            if (query.repliedProfileUsername) {
                where.repliedPost.profile = { username: query.repliedProfileUsername };
            }
        }
        if (query.quotedPostId || query.quotedProfileUsername) {
            where.quotedPost = {};

            if (query.quotedPostId) {
                where.quotedPost.id = query.quotedPostId;
            }

            if (query.quotedProfileUsername) {
                where.quotedPost.profile = { username: query.quotedProfileUsername };
            }
        }

        const posts = await this.postRepository.find({
            where,
            relations: {
                user: true,
                profile: true,
                repliedPost: { profile: true },
                quotedPost: { profile: true }
            },
            order: { createdAt: "DESC" }
        });

        return posts.map(post => postDto.parse(post));
    }
}
