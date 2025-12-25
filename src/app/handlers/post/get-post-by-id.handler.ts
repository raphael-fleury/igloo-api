import { Repository } from "typeorm";
import { postDto } from "@/app/dtos/post.dtos";
import { NotFoundError } from "@/app/errors";
import { appDataSource } from "@/database/data-source";
import { Post } from "@/database/entities/post";

export class GetPostByIdHandler {
    constructor(private readonly postRepository: Repository<Post>) { }

    static get default() {
        return new GetPostByIdHandler(appDataSource.getRepository(Post));
    }

    async handle(id: string) {
        const post = await this.postRepository.findOne({
            where: { id },
            relations: ['quotedPost']
        });
        
        if (!post) {
            throw new NotFoundError(`Post with id ${id} not found`);
        }

        return postDto.parse({
            id: post.id,
            userId: post.user.id,
            profileId: post.profile.id,
            content: post.content,
            repliedPostId: post.repliedPost?.id,
            quotedPostId: post.quotedPost?.id,
            createdAt: post.createdAt,
            updatedAt: post.updatedAt
        });
    }
}
