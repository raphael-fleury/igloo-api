import { Repository } from "typeorm";
import { NotFoundError, BlockedError } from "@/app/errors";
import { appDataSource } from "@/database/data-source";
import { Like } from "@/database/entities/like";
import { Post } from "@/database/entities/post";
import { Block } from "@/database/entities/block";
import { User } from "@/database/entities/user";
import { Profile } from "@/database/entities/profile";

export class LikePostHandler {
    constructor(
        private readonly likeRepository: Repository<Like>,
        private readonly postRepository: Repository<Post>,
        private readonly blockRepository: Repository<Block>
    ) { }

    static get default() {
        return new LikePostHandler(
            appDataSource.getRepository(Like),
            appDataSource.getRepository(Post),
            appDataSource.getRepository(Block)
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
        const blocked = await this.blockRepository.findOne({
            where: {
                blockerProfile: { id: profile.id },
                blockedProfile: { id: post.profile.id }
            }
        });

        if (blocked) {
            throw new BlockedError(`You cannot like a post from a profile that you have blocked`);
        }

        // Check if the author of the post has blocked the user
        const block = await this.blockRepository.findOne({
            where: {
                blockerProfile: { id: post.profile.id },
                blockedProfile: { id: profile.id }
            }
        });

        if (block) {
            throw new BlockedError(`You cannot like a post from a profile that has blocked you`);
        }

        // Check if already liked
        const existingLike = await this.likeRepository.findOne({
            where: {
                profile: { id: profile.id },
                post: { id: postId }
            }
        });

        if (existingLike) {
            return { 
                message: "Post is already liked", 
                likedAt: existingLike.createdAt 
            };
        }

        // Creation
        const like = this.likeRepository.create({ user, profile, post });
        const savedLike = await this.likeRepository.save(like);

        return {
            message: "Post liked successfully",
            likedAt: savedLike.createdAt
        };
    }
}

