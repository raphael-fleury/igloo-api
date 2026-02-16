import { Repository } from "typeorm";
import { NotFoundError, ConflictError } from "@/app/errors";
import { appDataSource } from "@/database/data-source";
import { InteractionType, PostInteraction } from "@/database/entities/post-interaction";
import { Post } from "@/database/entities/post";
import { NotificationType } from "@/database/entities/notification";
import { InteractionValidator } from "@/app/validators/interaction.validator";
import { UserDto } from "@/app/dtos/user.dtos";
import { ProfileDto } from "@/app/dtos/profile.dtos";
import { CommandHandler } from "@/app/cqrs";
import { CreateNotificationHandler } from "@/app/handlers/notification/create-notification.handler";

export type RepostPostCommand = {
    postId: string;
    user: UserDto;
    profile: ProfileDto;
}

export class RepostPostHandler implements CommandHandler<RepostPostCommand, void> {
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

    async handle({ postId, user, profile }: RepostPostCommand) {
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
            throw new ConflictError("Post is already reposted");
        }

        // Creation
        const repost = this.postInteractionRepository.create({
            user, profile, post, interactionType: InteractionType.Repost
        });
        
        await this.postInteractionRepository.save(repost);

        // Create notification (only if reposting someone else's post)
        if (profile.id !== post.profile.id) {
            await CreateNotificationHandler.default.handle({
                targetProfileId: post.profile.id,
                actorProfileId: profile.id,
                type: NotificationType.Repost,
                postId: post.id
            });
        }
    }
}

