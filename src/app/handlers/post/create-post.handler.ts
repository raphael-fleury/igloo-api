import { Repository } from "typeorm";
import { CreatePostDto, postDto } from "@/app/dtos/post.dtos";
import { NotFoundError } from "@/app/errors";
import { appDataSource } from "@/database/data-source";
import { Post } from "@/database/entities/post";
import { User } from "@/database/entities/user";
import { Profile } from "@/database/entities/profile";
import { InteractionValidator } from "@/app/validators/interaction.validator";

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

    async handle(data: CreatePostDto, user: User, profile: Profile) {
        // Validations
        let replyToPost = null;
        if (data.replyToPostId) {
            replyToPost = await this.postRepository.findOneBy({ id: data.replyToPostId });
            if (!replyToPost) {
                throw new NotFoundError(`Post with id ${data.replyToPostId} not found`);
            }

            // Check if profiles block each other
            await this.interactionValidator.assertProfilesDoesNotBlockEachOther(profile.id, replyToPost.profile.id);
        }

        let quoteToPost = null;
        if (data.quoteToPostId) {
            quoteToPost = await this.postRepository.findOneBy({ id: data.quoteToPostId });
            if (!quoteToPost) {
                throw new NotFoundError(`Post with id ${data.quoteToPostId} not found`);
            }

            // Check if profiles block each other
            await this.interactionValidator.assertProfilesDoesNotBlockEachOther(profile.id, quoteToPost.profile.id);
        }

        // Creation
        const post = this.postRepository.create({
            user,
            profile,
            content: data.content,
            replyToPost: replyToPost || undefined,
            quoteToPost: quoteToPost || undefined
        });

        const savedPost = await this.postRepository.save(post);

        return postDto.parse({
            id: savedPost.id,
            userId: savedPost.user.id,
            profileId: savedPost.profile.id,
            content: savedPost.content,
            replyToPostId: savedPost.replyToPost?.id,
            quoteToPostId: savedPost.quoteToPost?.id,
            createdAt: savedPost.createdAt,
            updatedAt: savedPost.updatedAt
        });
    }
}
