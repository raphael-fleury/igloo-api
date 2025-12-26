import { Repository } from "typeorm";
import { postDto, postDetailedDto } from "@/app/dtos/post.dtos";
import { profileDto } from "@/app/dtos/profile.dtos";
import { NotFoundError } from "@/app/errors";
import { appDataSource } from "@/database/data-source";
import { Post } from "@/database/entities/post";
import { PostInteraction, InteractionType } from "@/database/entities/post-interaction";

export class GetPostByIdHandler {
    constructor(
        private readonly postRepository: Repository<Post>,
        private readonly postInteractionRepository: Repository<PostInteraction>
    ) { }

    static get default() {
        return new GetPostByIdHandler(
            appDataSource.getRepository(Post),
            appDataSource.getRepository(PostInteraction)
        );
    }

    async handle(id: string) {
        const post = await this.postRepository.findOne({
            where: { id },
            relations: ['profile', 'repliedPost', 'quotedPost']
        });
        
        if (!post) {
            throw new NotFoundError(`Post with id ${id} not found`);
        }

        const likes = await this.postInteractionRepository.count({
            where: { post: { id }, interactionType: InteractionType.Like }
        });
        const reposts = await this.postInteractionRepository.count({
            where: { post: { id }, interactionType: InteractionType.Repost }
        });

        return postDetailedDto.parse({
            ...post,
            likes,
            reposts
        });
    }
}
