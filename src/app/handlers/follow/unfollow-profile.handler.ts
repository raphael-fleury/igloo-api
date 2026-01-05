import { Repository } from "typeorm";
import { ConflictError } from "@/app/errors";
import { appDataSource } from "@/database/data-source";
import { ProfileInteraction, ProfileInteractionType } from "@/database/entities/profile-interaction";
import { CommandHandler } from "@/app/cqrs";

type UnfollowProfileCommand = {
    sourceProfileId: string;
    targetProfileId: string;
}

export class UnfollowProfileHandler implements CommandHandler<UnfollowProfileCommand, void> {
    constructor(private readonly profileInteractionRepository: Repository<ProfileInteraction>) { }

    static get default() {
        return new UnfollowProfileHandler(appDataSource.getRepository(ProfileInteraction));
    }

    async handle({ sourceProfileId, targetProfileId }: UnfollowProfileCommand) {
        // Find the existing follow
        const follow = await this.profileInteractionRepository.findOne({
            where: {
                sourceProfile: { id: sourceProfileId },
                targetProfile: { id: targetProfileId },
                interactionType: ProfileInteractionType.Follow
            }
        });

        if (!follow) {
            throw new ConflictError(`Follow between profiles not found`);
        }

        await this.profileInteractionRepository.remove(follow);
    }
}
