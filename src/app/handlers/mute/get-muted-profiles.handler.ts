import { Repository } from "typeorm";
import { appDataSource } from "@/database/data-source";
import { ProfileInteraction, ProfileInteractionType } from "@/database/entities/profile-interaction";
import { profileDto } from "@/app/dtos/profile.dtos";

export class GetMutedProfilesHandler {
    constructor(private readonly profileInteractionRepository: Repository<ProfileInteraction>) { }

    static get default() {
        return new GetMutedProfilesHandler(appDataSource.getRepository(ProfileInteraction));
    }

    async handle(muterProfileId: string) {
        const mutes = await this.profileInteractionRepository.find({
            where: {
                sourceProfile: { id: muterProfileId },
                interactionType: ProfileInteractionType.Mute
            },
            relations: ["targetProfile"],
            order: {
                createdAt: "DESC"
            }
        });

        return {
            profiles: mutes.map(mute => ({
                ...profileDto.parse(mute.targetProfile),
                mutedAt: mute.createdAt
            })),
            total: mutes.length
        };
    }
}
