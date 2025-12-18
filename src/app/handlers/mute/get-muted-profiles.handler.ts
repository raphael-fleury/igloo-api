import { Repository } from "typeorm";
import { appDataSource } from "@/database/data-source";
import { Mute } from "@/database/entities/mute";
import { profileDto } from "@/app/dtos/profile.dtos";

export class GetMutedProfilesHandler {
    constructor(private readonly muteRepository: Repository<Mute>) { }

    static readonly default = new GetMutedProfilesHandler(appDataSource.getRepository(Mute));

    async handle(muterProfileId: string) {
        const mutes = await this.muteRepository.find({
            where: {
                muterProfile: { id: muterProfileId }
            },
            relations: ["mutedProfile"],
            order: {
                createdAt: "DESC"
            }
        });

        return {
            profiles: mutes.map(mute => ({
                ...profileDto.parse(mute.mutedProfile),
                mutedAt: mute.createdAt
            })),
            total: mutes.length
        };
    }
}
