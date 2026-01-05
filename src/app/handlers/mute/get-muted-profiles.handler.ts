import { Repository } from "typeorm";
import { appDataSource } from "@/database/data-source";
import { ProfileInteraction, ProfileInteractionType } from "@/database/entities/profile-interaction";
import { profileDto, ProfileDto } from "@/app/dtos/profile.dtos";
import { CommandHandler } from "@/app/cqrs";

type GetMutedProfilesCommand = {
    sourceProfileId: string;
}

type MutedProfilesDto = {
    profiles: (ProfileDto & { mutedAt: Date })[];
    total: number;
}

export class GetMutedProfilesHandler implements CommandHandler<GetMutedProfilesCommand, MutedProfilesDto> {
    constructor(private readonly profileInteractionRepository: Repository<ProfileInteraction>) { }

    static get default() {
        return new GetMutedProfilesHandler(appDataSource.getRepository(ProfileInteraction));
    }

    async handle({ sourceProfileId }: GetMutedProfilesCommand) {
        const mutes = await this.profileInteractionRepository.find({
            where: {
                sourceProfile: { id: sourceProfileId },
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
