import { Repository } from "typeorm";
import { appDataSource } from "@/database/data-source";
import { ProfileInteraction, ProfileInteractionType } from "@/database/entities/profile-interaction";
import { NotificationType } from "@/database/entities/notification";
import { InteractionValidator } from "@/app/validators/interaction.validator";
import { NotificationService } from "@/app/services/notification.service";
import { ConflictError } from "@/app/errors";
import { CommandHandler } from "@/app/cqrs";
import { PostInteractionDto } from "@/app/dtos/post-interaction.dto";

export class FollowProfileHandler implements CommandHandler<PostInteractionDto, void> {
    constructor(
        private readonly profileInteractionRepository: Repository<ProfileInteraction>,
        private readonly interactionValidator: InteractionValidator,
        private readonly notificationService: NotificationService
    ) { }

    static get default() {
        return new FollowProfileHandler(
            appDataSource.getRepository(ProfileInteraction),
            InteractionValidator.default,
            NotificationService.default
        );
    }

    async handle({ sourceProfileId, targetProfileId }: PostInteractionDto) {
        // Validations
        await this.interactionValidator.assertProfilesAreNotSame(sourceProfileId, targetProfileId);
        await this.interactionValidator.assertProfilesDoesNotBlockEachOther(sourceProfileId, targetProfileId);

        const sourceProfile = await this.interactionValidator.assertProfileExists(sourceProfileId);
        const targetProfile = await this.interactionValidator.assertProfileExists(targetProfileId);

        const existingFollow = await this.profileInteractionRepository.findOne({
            where: {
                sourceProfile: { id: sourceProfileId },
                targetProfile: { id: targetProfileId },
                interactionType: ProfileInteractionType.Follow
            }
        });

        if (existingFollow) {
            throw new ConflictError("Profile is already followed");
        }

        // Creation
        const follow = this.profileInteractionRepository.create({
            sourceProfile: sourceProfile,
            targetProfile: targetProfile,
            interactionType: ProfileInteractionType.Follow
        });

        await this.profileInteractionRepository.save(follow);

        // Create notification
        await this.notificationService.createNotification({
            targetProfileId: targetProfileId,
            actorProfileId: sourceProfileId,
            type: NotificationType.Follow
        });
    }
}
