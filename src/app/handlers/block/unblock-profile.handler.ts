import { Repository } from "typeorm";
import { NotFoundError } from "@/app/errors";
import { appDataSource } from "@/database/data-source";
import { Block } from "@/database/entities/block";

export class UnblockProfileHandler {
    constructor(private readonly blockRepository: Repository<Block>) { }

    static readonly default = new UnblockProfileHandler(appDataSource.getRepository(Block));

    async handle(blockerProfileId: string, blockedProfileId: string) {
        // Find the existing block
        const block = await this.blockRepository.findOne({
            where: {
                blockerProfile: { id: blockerProfileId },
                blockedProfile: { id: blockedProfileId }
            }
        });

        if (!block) {
            throw new NotFoundError(`Block between profiles not found`);
        }

        // Remove the block
        await this.blockRepository.remove(block);

        return {
            message: "Profile unblocked successfully",
            unblockedAt: new Date()
        };
    }
}