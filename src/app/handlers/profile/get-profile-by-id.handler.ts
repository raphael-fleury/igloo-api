import { Repository } from "typeorm";
import { DetailedProfileDto, ProfileDto, profileDto } from "@/app/dtos/profile.dtos";
import { NotFoundError } from "@/app/errors";
import { appDataSource } from "@/database/data-source";
import { Profile } from "@/database/entities/profile";
import { ProfileInteraction, ProfileInteractionType } from "@/database/entities/profile-interaction";

export class GetProfileByIdHandler {
    constructor(
        private readonly profileRepository: Repository<Profile>,
        private readonly profileInteractionRepository: Repository<ProfileInteraction> = appDataSource.getRepository(ProfileInteraction)
    ) { }

    static get default() {
        return new GetProfileByIdHandler(appDataSource.getRepository(Profile));
    }

    async handle(id: string, viewerProfileId?: string | null): Promise<ProfileDto | DetailedProfileDto> {
        const profile = await this.profileRepository.findOneBy({ id });

        if (!profile) {
            throw new NotFoundError(`Profile with id ${id} not found`);
        }

        const parsed = profileDto.parse(profile);

        if (!viewerProfileId || viewerProfileId === id) {
            return parsed;
        }

        const [blocksMe, blocked, followsMe, followed, muted] = await Promise.all([
            this.profileInteractionRepository.exists({
                where: {
                    sourceProfile: { id },
                    targetProfile: { id: viewerProfileId },
                    interactionType: ProfileInteractionType.Block
                }
            }),
            this.profileInteractionRepository.exists({
                where: {
                    sourceProfile: { id: viewerProfileId },
                    targetProfile: { id },
                    interactionType: ProfileInteractionType.Block
                }
            }),
            this.profileInteractionRepository.exists({
                where: {
                    sourceProfile: { id },
                    targetProfile: { id: viewerProfileId },
                    interactionType: ProfileInteractionType.Follow
                }
            }),
            this.profileInteractionRepository.exists({
                where: {
                    sourceProfile: { id: viewerProfileId },
                    targetProfile: { id },
                    interactionType: ProfileInteractionType.Follow
                }
            }),
            this.profileInteractionRepository.exists({
                where: {
                    sourceProfile: { id: viewerProfileId },
                    targetProfile: { id },
                    interactionType: ProfileInteractionType.Mute
                }
            }),
        ]);

        return {
            ...parsed,
            blocksMe,
            blocked,
            followsMe,
            followed,
            muted,
        };
    }
}
