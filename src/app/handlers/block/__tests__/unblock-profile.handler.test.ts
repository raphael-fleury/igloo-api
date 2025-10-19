import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Repository } from "typeorm";
import { UnblockProfileHandler } from "../unblock-profile.handler";
import { Block } from "@/database/entities/block";
import { NotFoundError } from "@/app/errors";

describe("UnblockProfileHandler", () => {
    let handler: UnblockProfileHandler;
    let mockBlockRepository: Repository<Block>;

    beforeEach(() => {
        mockBlockRepository = {
            findOne: mock(() => Promise.resolve(null)),
            remove: mock(() => Promise.resolve())
        } as any;

        handler = new UnblockProfileHandler(mockBlockRepository);
    });

    it("should unblock profile successfully when block exists", async () => {
        // Arrange
        const blockerProfileId = "blocker-id";
        const blockedProfileId = "blocked-id";
        const existingBlock = { id: "block-id" } as Block;

        mockBlockRepository.findOne = mock(() => Promise.resolve(existingBlock));

        // Act
        const result = await handler.handle(blockerProfileId, blockedProfileId);

        // Assert
        expect(result.message).toBe("Profile unblocked successfully");
        expect(result.unblockedAt).toBeInstanceOf(Date);
        expect(mockBlockRepository.remove).toHaveBeenCalledWith(existingBlock);
    });

    it("should throw NotFoundError when block does not exist", async () => {
        // Arrange
        const blockerProfileId = "blocker-id";
        const blockedProfileId = "blocked-id";

        mockBlockRepository.findOne = mock(() => Promise.resolve(null));

        // Act & Assert
        expect(async () => {
            await handler.handle(blockerProfileId, blockedProfileId);
        }).toThrow(NotFoundError);
    });
});