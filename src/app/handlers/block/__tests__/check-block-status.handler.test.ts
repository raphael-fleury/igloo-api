import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Repository } from "typeorm";
import { CheckBlockStatusHandler } from "../check-block-status.handler";
import { Block } from "@/database/entities/block";

describe("CheckBlockStatusHandler", () => {
    let handler: CheckBlockStatusHandler;
    let mockBlockRepository: Repository<Block>;

    beforeEach(() => {
        mockBlockRepository = {
            findOne: mock(() => Promise.resolve(null))
        } as any;

        handler = new CheckBlockStatusHandler(mockBlockRepository);
    });

    it("should return true when block exists", async () => {
        // Arrange
        const blockerProfileId = "blocker-id";
        const blockedProfileId = "blocked-id";
        const blockDate = new Date("2023-01-01");
        const existingBlock = {
            id: "block-id",
            createdAt: blockDate
        } as Block;

        mockBlockRepository.findOne = mock(() => Promise.resolve(existingBlock));

        // Act
        const result = await handler.handle(blockerProfileId, blockedProfileId);

        // Assert
        expect(result.isBlocked).toBe(true);
        expect(result.blockedAt).toEqual(blockDate);
        expect(mockBlockRepository.findOne).toHaveBeenCalledWith({
            where: {
                blockerProfile: { id: blockerProfileId },
                blockedProfile: { id: blockedProfileId }
            }
        });
    });

    it("should return false when block does not exist", async () => {
        // Arrange
        const blockerProfileId = "blocker-id";
        const blockedProfileId = "blocked-id";

        mockBlockRepository.findOne = mock(() => Promise.resolve(null));

        // Act
        const result = await handler.handle(blockerProfileId, blockedProfileId);

        // Assert
        expect(result.isBlocked).toBe(false);
        expect(result.blockedAt).toBeNull();
    });
});