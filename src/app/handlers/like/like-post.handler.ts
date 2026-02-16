import { Repository } from "typeorm";
import { NotFoundError, ConflictError } from "@/app/errors";
import { appDataSource } from "@/database/data-source";
import { InteractionType, PostInteraction } from "@/database/entities/post-interaction";
import { Post } from "@/database/entities/post";
import { NotificationType } from "@/database/entities/notification";
import { InteractionValidator } from "@/app/validators/interaction.validator";
import { NotificationService } from "@/app/services/notification.service";
import { UserDto } from "@/app/dtos/user.dtos";
import { ProfileDto } from "@/app/dtos/profile.dtos";
import { CommandHandler } from "@/app/cqrs";

export type LikePostCommand = {
    postId: string;
    user: UserDto;
    profile: ProfileDto;
}

export class LikePostHandler implements CommandHandler<LikePostCommand, void> {
    constructor(
        private readonly postInteractionRepository: Repository<PostInteraction>,
        private readonly postRepository: Repository<Post>,
        private readonly interactionValidator: InteractionValidator,
        private readonly notificationService: NotificationService
    ) { }

    static get default() {
        return new LikePostHandler(
            appDataSource.getRepository(PostInteraction),
            appDataSource.getRepository(Post),
            InteractionValidator.default,
            NotificationService.default
        );
    }

    async handle({ postId, user, profile }: LikePostCommand) {
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

        // Check if already liked
        const existingLike = await this.postInteractionRepository.findOne({
            where: {
                profile: { id: profile.id },
                post: { id: postId },
                interactionType: InteractionType.Like
            }
        });

        if (existingLike) {
            throw new ConflictError("Post is already liked");
        }

        // Creation
        const like = this.postInteractionRepository.create({
            user, profile, post, interactionType: InteractionType.Like
        });
        
        await this.postInteractionRepository.save(like);

        if (profile.id !== post.profile.id) {
            await this.notificationService.createNotification({
                targetProfileId: post.profile.id,
                actorProfileId: profile.id,
                type: NotificationType.Like,
                postId: post.id
            });
        }
    }
}
