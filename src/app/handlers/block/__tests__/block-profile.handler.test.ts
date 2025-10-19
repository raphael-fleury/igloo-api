import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Repository } from "typeorm";
import { BlockProfileHandler } from "../block-profile.handler";
import { Block } from "@/database/entities/block";
import { Profile } from "@/database/entities/profile";
import { NotFoundError } from "@/app/errors";

describe("BlockProfileHandler", () => {
    let handler: BlockProfileHandler;
    let mockBlockRepository: Repository<Block>;
    let mockProfileRepository: Repository<Profile>;

    beforeEach(() => {
        mockBlockRepository = {
            findOne: mock(() => Promise.resolve(null)),
            create: mock((data) => data),
            save: mock((data) => Promise.resolve({ ...data, id: "block-id", createdAt: new Date() }))
        } as any;

        mockProfileRepository = {
            findOneBy: mock(() => Promise.resolve(null))
        } as any;

        handler = new BlockProfileHandler(mockBlockRepository, mockProfileRepository);
    });

    it("should block profile successfully when both profiles exist", async () => {
        // Arrange
        const blockerProfileId = "blocker-id";
        const blockedProfileId = "blocked-id";
        
        const mockBlockerProfile = { id: blockerProfileId, username: "blocker" } as Profile;
        const mockBlockedProfile = { id: blockedProfileId, username: "blocked" } as Profile;

        mockProfileRepository.findOneBy = mock((criteria: any) => {
            if (criteria.id === blockerProfileId) return Promise.resolve(mockBlockerProfile);
            if (criteria.id === blockedProfileId) return Promise.resolve(mockBlockedProfile);
            return Promise.resolve(null);
        });

        // Act
        const result = await handler.handle(blockerProfileId, blockedProfileId);

        // Assert
        expect(result.message).toBe("Profile blocked successfully");
        expect(mockBlockRepository.create).toHaveBeenCalledWith({
            blockerProfile: mockBlockerProfile,
            blockedProfile: mockBlockedProfile
        });
        expect(mockBlockRepository.save).toHaveBeenCalled();
    });

    it("should throw NotFoundError when blocker profile does not exist", async () => {
        // Arrange
        const blockerProfileId = "non-existent-blocker";
        const blockedProfileId = "blocked-id";

        // Act & Assert
        expect(async () => {
            await handler.handle(blockerProfileId, blockedProfileId);
        }).toThrow(NotFoundError);
    });

    it("should throw NotFoundError when blocked profile does not exist", async () => {
        // Arrange
        const blockerProfileId = "blocker-id";
        const blockedProfileId = "non-existent-blocked";
        
        const mockBlockerProfile = { id: blockerProfileId, username: "blocker" } as Profile;

        mockProfileRepository.findOneBy = mock((criteria: any) => {
            if (criteria.id === blockerProfileId) return Promise.resolve(mockBlockerProfile);
            return Promise.resolve(null);
        });

        // Act & Assert
        expect(async () => {
            await handler.handle(blockerProfileId, blockedProfileId);
        }).toThrow(NotFoundError);
    });

    it("should return existing block when already blocked", async () => {
        // Arrange
        const blockerProfileId = "blocker-id";
        const blockedProfileId = "blocked-id";

        const mockBlockerProfile = { id: blockerProfileId, username: "blocker" } as Profile;
        const mockBlockedProfile = { id: blockedProfileId, username: "blocked" } as Profile;
        const existingBlock = { id: "existing-block-id" } as Block;

        mockProfileRepository.findOneBy = mock((criteria: any) => {
            if (criteria.id === blockerProfileId) return Promise.resolve(mockBlockerProfile);
            if (criteria.id === blockedProfileId) return Promise.resolve(mockBlockedProfile);
            return Promise.resolve(null);
        });

        mockBlockRepository.findOne = mock(() => Promise.resolve(existingBlock));

        // Act
        const result = await handler.handle(blockerProfileId, blockedProfileId);

        // Assert
        expect(result.message).toBe("Profile is already blocked");
        expect(mockBlockRepository.create).not.toHaveBeenCalled();
    });
});