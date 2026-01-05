import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Repository } from "typeorm";
import { UnblockProfileHandler } from "../unblock-profile.handler";
import { ConflictError } from "@/app/errors";
import { ProfileInteraction } from "@/database/entities/profile-interaction";

describe("UnblockProfileHandler", () => {
    let handler: UnblockProfileHandler;
    let mockProfileInteractionRepository: Repository<ProfileInteraction>;

    beforeEach(() => {
        mockProfileInteractionRepository = {
            findOne: mock(() => Promise.resolve(null)),
            remove: mock(() => Promise.resolve())
        } as any;

        handler = new UnblockProfileHandler(mockProfileInteractionRepository);
    });

    it("should unblock profile successfully when block exists", async () => {
        // Arrange
        const sourceProfileId = "blocker-id";
        const targetProfileId = "blocked-id";
        const existingBlock = { id: "block-id" } as ProfileInteraction;

        mockProfileInteractionRepository.findOne = mock(() => Promise.resolve(existingBlock));

        // Act
        await handler.handle({ sourceProfileId, targetProfileId });

        // Assert
        expect(mockProfileInteractionRepository.remove).toHaveBeenCalledWith(existingBlock);
    });

    it("should throw ConflictError when block does not exist", async () => {
        // Arrange
        const sourceProfileId = "blocker-id";
        const targetProfileId = "blocked-id";

        mockProfileInteractionRepository.findOne = mock(() => Promise.resolve(null));

        // Act & Assert
        expect(async () => {
            await handler.handle({ sourceProfileId, targetProfileId });
        }).toThrow(ConflictError);
    });
});
