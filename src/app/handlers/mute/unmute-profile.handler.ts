import { Repository } from "typeorm";
import { NotFoundError } from "@/app/errors";
import { appDataSource } from "@/database/data-source";
import { Mute } from "@/database/entities/mute";

export class UnmuteProfileHandler {
    constructor(private readonly muteRepository: Repository<Mute>) { }

    static readonly default = new UnmuteProfileHandler(appDataSource.getRepository(Mute));

    async handle(muterProfileId: string, mutedProfileId: string) {
        // Find the existing mute
        const mute = await this.muteRepository.findOne({
            where: {
                muterProfile: { id: muterProfileId },
                mutedProfile: { id: mutedProfileId }
            }
        });

        if (!mute) {
            throw new NotFoundError(`Mute between profiles not found`);
        }

        // Remove the mute
        await this.muteRepository.remove(mute);

        return {
            message: "Profile unmuted successfully",
            unmutedAt: new Date()
        };
    }
}
