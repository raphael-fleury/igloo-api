import { Repository } from "typeorm";
import { NotFoundError, BlockedError } from "@/app/errors";
import { appDataSource } from "@/database/data-source";
import { InteractionType, PostInteraction } from "@/database/entities/post-interaction";
import { ProfileInteraction, ProfileInteractionType } from "@/database/entities/profile-interaction";
import { Post } from "@/database/entities/post";
import { User } from "@/database/entities/user";
import { Profile } from "@/database/entities/profile";

export class RepostPostHandler {
    constructor(
        private readonly postInteractionRepository: Repository<PostInteraction>,
        private readonly postRepository: Repository<Post>,
        private readonly profileInteractionRepository: Repository<ProfileInteraction>
    ) { }

    static get default() {
        return new RepostPostHandler(
            appDataSource.getRepository(PostInteraction),
            appDataSource.getRepository(Post),
            appDataSource.getRepository(ProfileInteraction)
        );
    }

    async handle(postId: string, user: User, profile: Profile) {
        // Validations
        const post = await this.postRepository.findOne({
            where: { id: postId },
            relations: ['profile']
        });

        if (!post) {
            throw new NotFoundError(`Post with id ${postId} not found`);
        }

        // Check if the user has blocked the author of the post
        const blocked = await this.profileInteractionRepository.findOne({
            where: {
                sourceProfile: { id: profile.id },
                targetProfile: { id: post.profile.id },
                interactionType: ProfileInteractionType.Block
            }
        });

        if (blocked) {
            throw new BlockedError(`You cannot repost a post from a profile that you have blocked`);
        }

        // Check if the author of the post has blocked the user
        const block = await this.profileInteractionRepository.findOne({
            where: {
                sourceProfile: { id: post.profile.id },
                targetProfile: { id: profile.id },
                interactionType: ProfileInteractionType.Block
            }
        });

        if (block) {
            throw new BlockedError(`You cannot repost a post from a profile that has blocked you`);
        }

        // Check if already reposted
        const existingRepost = await this.postInteractionRepository.findOne({
            where: {
                profile: { id: profile.id },
                post: { id: postId },
                interactionType: InteractionType.Repost
            }
        });

        if (existingRepost) {
            return { 
                message: "Post is already reposted", 
                repostedAt: existingRepost.createdAt 
            };
        }

        // Creation
        const repost = this.postInteractionRepository.create({
            user, profile, post, interactionType: InteractionType.Repost
        });
        const savedRepost = await this.postInteractionRepository.save(repost);

        return {
            message: "Post reposted successfully",
            repostedAt: savedRepost.createdAt
        };
    }
}

