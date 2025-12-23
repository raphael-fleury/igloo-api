import { Repository } from "typeorm";
import { CreatePostDto, postDto } from "@/app/dtos/post.dtos";
import { BlockedError, NotFoundError } from "@/app/errors";
import { appDataSource } from "@/database/data-source";
import { Post } from "@/database/entities/post";
import { User } from "@/database/entities/user";
import { Profile } from "@/database/entities/profile";
import { Block } from "@/database/entities/block";

export class CreatePostHandler {
    constructor(
        private readonly postRepository: Repository<Post>,
        private readonly blockRepository: Repository<Block>
    ) { }

    static get default() {
        return new CreatePostHandler(
            appDataSource.getRepository(Post),
            appDataSource.getRepository(Block)
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
            const blocked = await this.blockRepository.findOne({
                where: {
                    blockerProfile: { id: profile.id },
                    blockedProfile: { id: replyToPost.profile.id }
                }
            });

            if (blocked) {
                throw new BlockedError(`You cannot reply to a post from a profile that you have blocked`);
            }

            // Check if the author of the replyToPost has blocked the user
            const block = await this.blockRepository.findOne({
                where: {
                    blockerProfile: { id: replyToPost.profile.id },
                    blockedProfile: { id: profile.id }
                }
            });

            if (block) {
                throw new BlockedError(`You cannot reply to a post from a profile that has blocked you`);
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
