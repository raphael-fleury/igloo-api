import { Repository } from "typeorm";
import { CreatePostDto, PostDto, postDto } from "@/app/dtos/post.dtos";
import { NotFoundError } from "@/app/errors";
import { appDataSource } from "@/database/data-source";
import { Post } from "@/database/entities/post";
import { InteractionValidator } from "@/app/validators/interaction.validator";
import { UserDto } from "@/app/dtos/user.dtos";
import { ProfileDto } from "@/app/dtos/profile.dtos";
import { CommandHandler } from "@/app/cqrs";

type CreatePostCommand = {
    data: CreatePostDto;
    user: UserDto;
    profile: ProfileDto;
}

export class CreatePostHandler implements CommandHandler<CreatePostCommand, PostDto> {
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

    async handle({ data, user, profile }: CreatePostCommand) {
        // Validations
        let repliedPost = null;
        if (data.repliedPostId) {
            repliedPost = await this.postRepository.findOneBy({ id: data.repliedPostId });
            if (!repliedPost) {
                throw new NotFoundError(`Post with id ${data.repliedPostId} not found`);
            }

            // Check if profiles block each other
            await this.interactionValidator.assertProfilesDoesNotBlockEachOther(profile.id, repliedPost.profile.id);
        }

        let quotedPost = null;
        if (data.quotedPostId) {
            quotedPost = await this.postRepository.findOneBy({ id: data.quotedPostId });
            if (!quotedPost) {
                throw new NotFoundError(`Post with id ${data.quotedPostId} not found`);
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
            profile: savedPost.profile,
            repliedPostId: savedPost.repliedPost?.id,
            quotedPostId: savedPost.quotedPost?.id,
            createdAt: savedPost.createdAt,
            updatedAt: savedPost.updatedAt
        });
    }
}
