import { Repository } from "typeorm";
import { NotFoundError } from "@/app/errors";
import { appDataSource } from "@/database/data-source";
import { Block } from "@/database/entities/block";
import { Profile } from "@/database/entities/profile";
import { Follow } from "@/database/entities/follow";

export class BlockProfileHandler {
    constructor(
        private readonly blockRepository: Repository<Block>,
        private readonly profileRepository: Repository<Profile>,
        private readonly followRepository: Repository<Follow>
    ) { }

    static get default() {
        return new BlockProfileHandler(
            appDataSource.getRepository(Block),
            appDataSource.getRepository(Profile),
            appDataSource.getRepository(Follow)
        );
    }

    async handle(blockerProfileId: string, blockedProfileId: string) {
        // Validations
        const blockerProfile = await this.profileRepository.findOneBy({ id: blockerProfileId });
        if (!blockerProfile) {
            throw new NotFoundError(`Blocker profile with id ${blockerProfileId} not found`);
        }

        const blockedProfile = await this.profileRepository.findOneBy({ id: blockedProfileId });
        if (!blockedProfile) {
            throw new NotFoundError(`Blocked profile with id ${blockedProfileId} not found`);
        }

        const existingBlock = await this.blockRepository.findOne({
            where: {
                blockerProfile: { id: blockerProfileId },
                blockedProfile: { id: blockedProfileId }
            }
        });

        if (existingBlock) {
            return { message: "Profile is already blocked", blockedAt: existingBlock.createdAt };
        }

        // Remove follows in both directions
        const followerFollow = await this.followRepository.findOne({
            where: {
                followerProfile: { id: blockerProfileId },
                followedProfile: { id: blockedProfileId }
            }
        });

        if (followerFollow) {
            await this.followRepository.remove(followerFollow);
        }

        const followedByFollow = await this.followRepository.findOne({
            where: {
                followerProfile: { id: blockedProfileId },
                followedProfile: { id: blockerProfileId }
            }
        });

        if (followedByFollow) {
            await this.followRepository.remove(followedByFollow);
        }

        // Creation
        const block = this.blockRepository.create({
            blockerProfile,
            blockedProfile
        });

        const savedBlock = await this.blockRepository.save(block);

        return {
            message: "Profile blocked successfully",
            blockedAt: savedBlock.createdAt
        };
    }
}