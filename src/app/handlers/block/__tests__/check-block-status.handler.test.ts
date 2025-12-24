import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Repository } from "typeorm";
import { CheckBlockStatusHandler } from "../check-block-status.handler";
import { ProfileInteraction, ProfileInteractionType } from "@/database/entities/profile-interaction";

describe("CheckBlockStatusHandler", () => {
    let handler: CheckBlockStatusHandler;
    let mockProfileInteractionRepository: Repository<ProfileInteraction>;

    beforeEach(() => {
        mockProfileInteractionRepository = {
            findOne: mock(() => Promise.resolve(null))
        } as any;

        handler = new CheckBlockStatusHandler(mockProfileInteractionRepository);
    });

    it("should return true when block exists", async () => {
        // Arrange
        const blockerProfileId = "blocker-id";
        const blockedProfileId = "blocked-id";
        const blockDate = new Date("2023-01-01");
        const existingBlock = {
            id: "block-id",
            interactionType: ProfileInteractionType.Block,
            createdAt: blockDate
        } as ProfileInteraction;

        mockProfileInteractionRepository.findOne = mock(() => Promise.resolve(existingBlock));

        // Act
        const result = await handler.handle(blockerProfileId, blockedProfileId);

        // Assert
        expect(result.isBlocked).toBe(true);
        expect(result.blockedAt).toEqual(blockDate);
        expect(mockProfileInteractionRepository.findOne).toHaveBeenCalledWith({
            where: {
                sourceProfile: { id: blockerProfileId },
                targetProfile: { id: blockedProfileId },
                interactionType: ProfileInteractionType.Block
            }
        });
    });

    it("should return false when block does not exist", async () => {
        // Arrange
        const blockerProfileId = "blocker-id";
        const blockedProfileId = "blocked-id";

        mockProfileInteractionRepository.findOne = mock(() => Promise.resolve(null));

        // Act
        const result = await handler.handle(blockerProfileId, blockedProfileId);

        // Assert
        expect(result.isBlocked).toBe(false);
        expect(result.blockedAt).toBeNull();
    });
});