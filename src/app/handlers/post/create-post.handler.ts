import { Repository } from "typeorm";
import { CreatePostDto, postDto } from "@/app/dtos/post.dtos";
import { BlockedError, NotFoundError } from "@/app/errors";
import { appDataSource } from "@/database/data-source";
import { Post } from "@/database/entities/post";
import { User } from "@/database/entities/user";
import { Profile } from "@/database/entities/profile";
import { ProfileInteraction, ProfileInteractionType } from "@/database/entities/profile-interaction";

export class CreatePostHandler {
    constructor(
        private readonly postRepository: Repository<Post>,
        private readonly profileInteractionRepository: Repository<ProfileInteraction>
    ) { }

    static get default() {
        return new CreatePostHandler(
            appDataSource.getRepository(Post),
            appDataSource.getRepository(ProfileInteraction)
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

            // Check if the user has blocked the author of the replied post
            const blocked = await this.profileInteractionRepository.findOne({
                where: {
                    sourceProfile: { id: profile.id },
                    targetProfile: { id: replyToPost.profile.id },
                    interactionType: ProfileInteractionType.Block
                }
            });

            if (blocked) {
                throw new BlockedError(`You cannot reply to a post from a profile that you have blocked`);
            }

            // Check if the author of the replyToPost has blocked the user
            const block = await this.profileInteractionRepository.findOne({
                where: {
                    sourceProfile: { id: replyToPost.profile.id },
                    targetProfile: { id: profile.id },
                    interactionType: ProfileInteractionType.Block
                }
            });

            if (block) {
                throw new BlockedError(`You cannot reply to a post from a profile that has blocked you`);
            }
        }

        let quoteToPost = null;
        if (data.quoteToPostId) {
            quoteToPost = await this.postRepository.findOneBy({ id: data.quoteToPostId });
            if (!quoteToPost) {
                throw new NotFoundError(`Post with id ${data.quoteToPostId} not found`);
            }

            // Check if the user has blocked the author of the quoted post
            const blocked = await this.profileInteractionRepository.findOne({
                where: {
                    sourceProfile: { id: profile.id },
                    targetProfile: { id: quoteToPost.profile.id },
                    interactionType: ProfileInteractionType.Block
                }
            });

            if (blocked) {
                throw new BlockedError(`You cannot quote a post from a profile that you have blocked`);
            }

            // Check if the author of the quoteToPost has blocked the user
            const block = await this.profileInteractionRepository.findOne({
                where: {
                    sourceProfile: { id: quoteToPost.profile.id },
                    targetProfile: { id: profile.id },
                    interactionType: ProfileInteractionType.Block
                }
            });

            if (block) {
                throw new BlockedError(`You cannot quote a post from a profile that has blocked you`);
            }
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
