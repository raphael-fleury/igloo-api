import { Repository } from "typeorm";
import { CreatePostDto, postDto } from "@/app/dtos/post.dtos";
import { NotFoundError } from "@/app/errors";
import { appDataSource } from "@/database/data-source";
import { Post } from "@/database/entities/post";
import { InteractionValidator } from "@/app/validators/interaction.validator";
import { UserDto } from "@/app/dtos/user.dtos";
import { ProfileDto } from "@/app/dtos/profile.dtos";

export class CreatePostHandler {
    constructor(
        private readonly postRepository: Repository<Post>,
        private readonly interactionValidator: InteractionValidator
    ) { }

    static get default() {
        return new CreatePostHandler(
            appDataSource.getRepository(Post),
            InteractionValidator.default
        );
    }

    async handle(data: CreatePostDto, user: UserDto, profile: ProfileDto) {
        // Validations
        let repliedPost = null;
        if (data.replyToPostId) {
            repliedPost = await this.postRepository.findOneBy({ id: data.replyToPostId });
            if (!repliedPost) {
                throw new NotFoundError(`Post with id ${data.replyToPostId} not found`);
            }

            // Check if profiles block each other
            await this.interactionValidator.assertProfilesDoesNotBlockEachOther(profile.id, repliedPost.profile.id);
        }

        let quotedPost = null;
        if (data.quoteToPostId) {
            quotedPost = await this.postRepository.findOneBy({ id: data.quoteToPostId });
            if (!quotedPost) {
                throw new NotFoundError(`Post with id ${data.quoteToPostId} not found`);
            }

            // Check if profiles block each other
            await this.interactionValidator.assertProfilesDoesNotBlockEachOther(profile.id, quotedPost.profile.id);
        }

        // Creation
        const post = this.postRepository.create({
            user,
            profile,
            content: data.content,
            repliedPost: repliedPost || undefined,
            quotedPost: quotedPost || undefined
        });

        const savedPost = await this.postRepository.save(post);

        return postDto.parse({
            id: savedPost.id,
            content: savedPost.content,
            replyToPostId: savedPost.repliedPost?.id,
            quoteToPostId: savedPost.quotedPost?.id,
            createdAt: savedPost.createdAt,
            updatedAt: savedPost.updatedAt
        });
    }
}
