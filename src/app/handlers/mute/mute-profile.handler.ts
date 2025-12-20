import { Repository } from "typeorm";
import { NotFoundError } from "@/app/errors";
import { appDataSource } from "@/database/data-source";
import { Mute } from "@/database/entities/mute";
import { Profile } from "@/database/entities/profile";

export class MuteProfileHandler {
    constructor(
        private readonly muteRepository: Repository<Mute>,
        private readonly profileRepository: Repository<Profile>
    ) { }

    static get default() {
        return new MuteProfileHandler(
            appDataSource.getRepository(Mute),
            appDataSource.getRepository(Profile)
        );
    }

    async handle(muterProfileId: string, mutedProfileId: string) {
        // Validations
        const muterProfile = await this.profileRepository.findOneBy({ id: muterProfileId });
        if (!muterProfile) {
            throw new NotFoundError(`Muter profile with id ${muterProfileId} not found`);
        }

        const mutedProfile = await this.profileRepository.findOneBy({ id: mutedProfileId });
        if (!mutedProfile) {
            throw new NotFoundError(`Muted profile with id ${mutedProfileId} not found`);
        }

        const existingMute = await this.muteRepository.findOne({
            where: {
                muterProfile: { id: muterProfileId },
                mutedProfile: { id: mutedProfileId }
            }
        });

        if (existingMute) {
            return { message: "Profile is already muted", mutedAt: existingMute.createdAt };
        }

        // Creation
        const mute = this.muteRepository.create({
            muterProfile,
            mutedProfile
        });

        const savedMute = await this.muteRepository.save(mute);

        return {
            message: "Profile muted successfully",
            mutedAt: savedMute.createdAt
        };
    }
}
