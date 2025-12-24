import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Repository } from "typeorm";
import { BlockProfileHandler } from "../block-profile.handler";
import { ProfileInteraction, ProfileInteractionType } from "@/database/entities/profile-interaction";
import { Profile } from "@/database/entities/profile";
import { NotFoundError } from "@/app/errors";
import { InteractionValidator } from "@/app/validators/interaction.validator";

describe("BlockProfileHandler", () => {
    let handler: BlockProfileHandler;
    let mockProfileInteractionRepository: Repository<ProfileInteraction>;
    let mockInteractionValidator: InteractionValidator;

    beforeEach(() => {
        mockProfileInteractionRepository = {
            findOne: mock(() => Promise.resolve(null)),
            create: mock((data) => data),
            save: mock((data) => Promise.resolve({ ...data, id: "block-id", createdAt: new Date() })),
            remove: mock((data) => Promise.resolve(data))
        } as any;

        mockInteractionValidator = {
            assertProfileExists: mock(() => Promise.resolve({ id: "profile-id" } as Profile))
        } as any;

        handler = new BlockProfileHandler(mockProfileInteractionRepository, mockInteractionValidator);
    });

    it("should block profile successfully when both profiles exist", async () => {
        // Arrange
        const blockerProfileId = "blocker-id";
        const blockedProfileId = "blocked-id";
        
        const mockBlockerProfile = { id: blockerProfileId, username: "blocker" } as Profile;
        const mockBlockedProfile = { id: blockedProfileId, username: "blocked" } as Profile;

        mockInteractionValidator.assertProfileExists = mock((profileId: string) => {
            if (profileId === blockerProfileId) return Promise.resolve(mockBlockerProfile);
            if (profileId === blockedProfileId) return Promise.resolve(mockBlockedProfile);
            return Promise.resolve({ id: profileId } as Profile);
        });

        // Act
        const result = await handler.handle(blockerProfileId, blockedProfileId);

        // Assert
        expect(result.message).toBe("Profile blocked successfully");
        expect(mockProfileInteractionRepository.create).toHaveBeenCalledWith({
            sourceProfile: mockBlockerProfile,
            targetProfile: mockBlockedProfile,
            interactionType: ProfileInteractionType.Block
        });
        expect(mockProfileInteractionRepository.save).toHaveBeenCalled();
    });

    it("should remove follows in both directions when blocking a profile", async () => {
        // Arrange
        const blockerProfileId = "blocker-id";
        const blockedProfileId = "blocked-id";
        
        const mockBlockerProfile = { id: blockerProfileId, username: "blocker" } as Profile;
        const mockBlockedProfile = { id: blockedProfileId, username: "blocked" } as Profile;
        const mockFollowFromBlocker = { 
            id: "follow-1", 
            sourceProfile: mockBlockerProfile, 
            targetProfile: mockBlockedProfile,
            interactionType: ProfileInteractionType.Follow
        } as ProfileInteraction;
        const mockFollowFromBlocked = { 
            id: "follow-2", 
            sourceProfile: mockBlockedProfile, 
            targetProfile: mockBlockerProfile,
            interactionType: ProfileInteractionType.Follow
        } as ProfileInteraction;

        mockInteractionValidator.assertProfileExists = mock((profileId: string) => {
            if (profileId === blockerProfileId) return Promise.resolve(mockBlockerProfile);
            if (profileId === blockedProfileId) return Promise.resolve(mockBlockedProfile);
            return Promise.resolve({ id: profileId } as Profile);
        });

        let followFindOneCall = 0;
        mockProfileInteractionRepository.findOne = mock(() => {
            followFindOneCall++;
            if (followFindOneCall === 1) return Promise.resolve(mockFollowFromBlocker);
            if (followFindOneCall === 2) return Promise.resolve(mockFollowFromBlocked);
            if (followFindOneCall === 3) return Promise.resolve(null); // existing block check
            return Promise.resolve(null);
        });

        // Act
        const result = await handler.handle(blockerProfileId, blockedProfileId);

        // Assert
        expect(result.message).toBe("Profile blocked successfully");
        expect(mockProfileInteractionRepository.findOne).toHaveBeenCalledTimes(3);
        expect(mockProfileInteractionRepository.remove).toHaveBeenCalledTimes(2);
    });

    it("should throw NotFoundError when blocker profile does not exist", async () => {
        // Arrange
        const blockerProfileId = "non-existent-blocker";
        const blockedProfileId = "blocked-id";

        mockInteractionValidator.assertProfileExists = mock(() => {
            throw new NotFoundError(`Profile with id ${blockerProfileId} not found`);
        });

        // Act & Assert
        expect(handler.handle(blockerProfileId, blockedProfileId))
            .rejects.toThrow(NotFoundError);
    });

    it("should throw NotFoundError when blocked profile does not exist", async () => {
        // Arrange
        const blockerProfileId = "blocker-id";
        const blockedProfileId = "non-existent-blocked";
        
        const mockBlockerProfile = { id: blockerProfileId, username: "blocker" } as Profile;

        mockInteractionValidator.assertProfileExists = mock((profileId: string) => {
            if (profileId === blockerProfileId) return Promise.resolve(mockBlockerProfile);
            throw new NotFoundError(`Profile with id ${blockedProfileId} not found`);
        });

        // Act & Assert
        expect(handler.handle(blockerProfileId, blockedProfileId))
            .rejects.toThrow(NotFoundError);
    });

    it("should return existing block when already blocked", async () => {
        // Arrange
        const blockerProfileId = "blocker-id";
        const blockedProfileId = "blocked-id";

        const mockBlockerProfile = { id: blockerProfileId, username: "blocker" } as Profile;
        const mockBlockedProfile = { id: blockedProfileId, username: "blocked" } as Profile;
        const existingBlock = { 
            id: "existing-block-id",
            sourceProfile: mockBlockerProfile,
            targetProfile: mockBlockedProfile,
            interactionType: ProfileInteractionType.Block,
            createdAt: new Date()
        } as ProfileInteraction;

        mockInteractionValidator.assertProfileExists = mock((profileId: string) => {
            if (profileId === blockerProfileId) return Promise.resolve(mockBlockerProfile);
            if (profileId === blockedProfileId) return Promise.resolve(mockBlockedProfile);
            return Promise.resolve({ id: profileId } as Profile);
        });

        mockProfileInteractionRepository.findOne = mock(() => Promise.resolve(existingBlock));

        // Act
        const result = await handler.handle(blockerProfileId, blockedProfileId);

        // Assert
        expect(result.message).toBe("Profile is already blocked");
        expect(mockProfileInteractionRepository.create).not.toHaveBeenCalled();
    });
});