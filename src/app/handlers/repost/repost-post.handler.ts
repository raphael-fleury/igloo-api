import { Repository } from "typeorm";
import { NotFoundError } from "@/app/errors";
import { appDataSource } from "@/database/data-source";
import { InteractionType, PostInteraction } from "@/database/entities/post-interaction";
import { Post } from "@/database/entities/post";
import { InteractionValidator } from "@/app/validators/interaction.validator";
import { UserDto } from "@/app/dtos/user.dtos";
import { ProfileDto } from "@/app/dtos/profile.dtos";

export class RepostPostHandler {
    constructor(
        private readonly postInteractionRepository: Repository<PostInteraction>,
        private readonly postRepository: Repository<Post>,
        private readonly interactionValidator: InteractionValidator
    ) { }

    static get default() {
        return new RepostPostHandler(
            appDataSource.getRepository(PostInteraction),
            appDataSource.getRepository(Post),
            InteractionValidator.default
        );
    }

    async handle(postId: string, user: UserDto, profile: ProfileDto) {
        // Validations
        const post = await this.postRepository.findOne({
            where: { id: postId },
            relations: ['profile']
        });

        if (!post) {
            throw new NotFoundError(`Post with id ${postId} not found`);
        }

        // Check if profiles block each other
        await this.interactionValidator.assertProfilesDoesNotBlockEachOther(profile.id, post.profile.id);

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

