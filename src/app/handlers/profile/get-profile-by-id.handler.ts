import { Repository } from "typeorm";
import { DetailedProfileDto, ProfileDto, profileDto } from "@/app/dtos/profile.dtos";
import { NotFoundError } from "@/app/errors";
import { appDataSource } from "@/database/data-source";
import { Profile } from "@/database/entities/profile";
import { ProfileInteraction, ProfileInteractionType } from "@/database/entities/profile-interaction";

export class GetProfileByIdHandler {
    constructor(
        private readonly profileRepository: Repository<Profile>,
        private readonly profileInteractionRepository: Repository<ProfileInteraction>
    ) { }

    static get default() {
        return new GetProfileByIdHandler(
            appDataSource.getRepository(Profile),
            appDataSource.getRepository(ProfileInteraction)
        );
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

        const interactions = await this.profileInteractionRepository.find({
            select: ["interactionType", "sourceProfile", "targetProfile"],
            where: [
                { sourceProfile: { id }, targetProfile: { id: viewerProfileId } },
                { sourceProfile: { id: viewerProfileId }, targetProfile: { id } },
            ]
        });

        const isFromViewer = (i: ProfileInteraction) => i.sourceProfile.id === viewerProfileId;
        const isFromTarget = (i: ProfileInteraction) => i.sourceProfile.id === id;
        const has = (type: ProfileInteractionType, from: "viewer" | "target") =>
            interactions.some(i =>
                i.interactionType === type &&
                (from === "viewer" ? isFromViewer(i) : isFromTarget(i))
            );

        const relations = {
            blocksMe: has(ProfileInteractionType.Block, "target"),
            blocked: has(ProfileInteractionType.Block, "viewer"),
            followsMe: has(ProfileInteractionType.Follow, "target"),
            followed: has(ProfileInteractionType.Follow, "viewer"),
            muted: has(ProfileInteractionType.Mute, "viewer"),
        };

        return {
            ...parsed,
            ...relations
        };
    }
}
