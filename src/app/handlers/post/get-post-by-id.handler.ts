import { Repository } from "typeorm";
import { postDetailedDto, PostDetailedDto } from "@/app/dtos/post.dtos";
import { NotFoundError } from "@/app/errors";
import { appDataSource } from "@/database/data-source";
import { Post } from "@/database/entities/post";
import { getPostById } from "@/database/queries/post.queries";
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
            .apply(getPostById(id));

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
