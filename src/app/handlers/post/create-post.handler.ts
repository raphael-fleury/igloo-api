import { Repository } from "typeorm";
import { CreatePostDto, postDto } from "@/app/dtos/post.dtos";
import { NotFoundError } from "@/app/errors";
import { appDataSource } from "@/database/data-source";
import { Post } from "@/database/entities/post";
import { User } from "@/database/entities/user";
import { Profile } from "@/database/entities/profile";

export class CreatePostHandler {
    constructor(
        private readonly postRepository: Repository<Post>
    ) { }

    static get default() {
        return new CreatePostHandler(appDataSource.getRepository(Post));
    }

    async handle(data: CreatePostDto, user: User, profile: Profile) {
        // Validations
        let replyToPost = null;
        if (data.replyToPostId) {
            replyToPost = await this.postRepository.findOneBy({ id: data.replyToPostId });
            if (!replyToPost) {
                throw new NotFoundError(`Post with id ${data.replyToPostId} not found`);
            }
        }

        // Creation
        const post = this.postRepository.create({
            user,
            profile,
            content: data.content,
            replyToPost: replyToPost || undefined
        });

        const savedPost = await this.postRepository.save(post);

        return postDto.parse({
            id: savedPost.id,
            userId: savedPost.user.id,
            profileId: savedPost.profile.id,
            content: savedPost.content,
            replyToPostId: savedPost.replyToPost?.id,
            createdAt: savedPost.createdAt,
            updatedAt: savedPost.updatedAt
        });
    }
}
