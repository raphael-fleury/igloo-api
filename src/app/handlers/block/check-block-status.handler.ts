import { Repository } from "typeorm";
import { appDataSource } from "@/database/data-source";
import { Block } from "@/database/entities/block";

export class CheckBlockStatusHandler {
    constructor(private readonly blockRepository: Repository<Block>) { }

    static readonly default = new CheckBlockStatusHandler(appDataSource.getRepository(Block));

    async handle(blockerProfileId: string, blockedProfileId: string) {
        const block = await this.blockRepository.findOne({
            where: {
                blockerProfile: { id: blockerProfileId },
                blockedProfile: { id: blockedProfileId }
            }
        });

        return {
            isBlocked: !!block,
            blockedAt: block?.createdAt || null
        };
    }
}