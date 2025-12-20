import { Repository } from "typeorm";
import { appDataSource } from "@/database/data-source";
import { Block } from "@/database/entities/block";
import { profileDto } from "@/app/dtos/profile.dtos";

export class GetBlockedProfilesHandler {
    constructor(private readonly blockRepository: Repository<Block>) { }

    static get default() {
        return new GetBlockedProfilesHandler(appDataSource.getRepository(Block));
    }

    async handle(blockerProfileId: string) {
        const blocks = await this.blockRepository.find({
            where: {
                blockerProfile: { id: blockerProfileId }
            },
            relations: ["blockedProfile"],
            order: {
                createdAt: "DESC"
            }
        });

        return {
            profiles: blocks.map(block => ({
                ...profileDto.parse(block.blockedProfile),
                blockedAt: block.createdAt
            })),
            total: blocks.length
        };
    }
}