import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Repository } from "typeorm";
import { zocker } from "zocker";
import { idDto } from "@/app/dtos/common.dtos";
import { profileDto } from "@/app/dtos/profile.dtos";
import { BlockProfileHandler } from "../block-profile.handler";
import { ProfileInteraction, ProfileInteractionType } from "@/database/entities/profile-interaction";
import { Profile } from "@/database/entities/profile";
import { NotFoundError, ConflictError } from "@/app/errors";
import { InteractionValidator } from "@/app/validators/interaction.validator";

describe("BlockProfileHandler", () => {
    let handler: BlockProfileHandler;
    let mockProfileInteractionRepository: Repository<ProfileInteraction>;
    let mockInteractionValidator: InteractionValidator;

    beforeEach(() => {
        mockProfileInteractionRepository = {
            findOne: mock(),
            create: mock(),
            save: mock((data) => Promise.resolve({
                ...data,
                id: zocker(idDto).generate(),
                createdAt: new Date()
            })),
            remove: mock()
        } as any;

        mockInteractionValidator = {
            assertProfileExists: mock()
        } as any;

        handler = new BlockProfileHandler(mockProfileInteractionRepository, mockInteractionValidator);
    });

    it("should block profile successfully when both profiles exist", async () => {
        // Arrange
        const blockerProfile = zocker(profileDto).generate();
        const blockedProfile = zocker(profileDto).generate();

        mockInteractionValidator.assertProfileExists = mock((profileId: string) => {
            if (profileId === blockerProfile.id) return Promise.resolve(blockerProfile);
            if (profileId === blockedProfile.id) return Promise.resolve(blockedProfile);
            return Promise.resolve({ id: profileId } as Profile);
        });

        // Act
        const result = await handler.handle(blockerProfile.id, blockedProfile.id);

        // Assert
        expect(result.message).toBe("Profile blocked successfully");
        expect(mockProfileInteractionRepository.create).toHaveBeenCalledWith({
            sourceProfile: blockerProfile,
            targetProfile: blockedProfile,
            interactionType: ProfileInteractionType.Block
        });
        expect(mockProfileInteractionRepository.save).toHaveBeenCalled();
    });

    it("should remove follows in both directions when blocking a profile", async () => {
        // Arrange
        const blockerProfile = zocker(profileDto).generate();
        const blockedProfile = zocker(profileDto).generate();

        const mockFollowFromBlocker = { 
            id: zocker(idDto).generate(), 
            sourceProfile: blockerProfile, 
            targetProfile: blockedProfile,
            interactionType: ProfileInteractionType.Follow
        } as ProfileInteraction;
        const mockFollowFromBlocked = { 
            id: zocker(idDto).generate(), 
            sourceProfile: blockedProfile, 
            targetProfile: blockerProfile,
            interactionType: ProfileInteractionType.Follow
        } as ProfileInteraction;

        mockInteractionValidator.assertProfileExists = mock((profileId: string) => {
            if (profileId === blockerProfile.id) return Promise.resolve(blockerProfile);
            if (profileId === blockedProfile.id) return Promise.resolve(blockedProfile);
            return Promise.resolve({ id: profileId } as Profile);
        });

        mockProfileInteractionRepository.findOne = mock()
            .mockResolvedValueOnce(mockFollowFromBlocker)
            .mockResolvedValueOnce(mockFollowFromBlocked)
            .mockResolvedValueOnce(null); // block check

        // Act
        const result = await handler.handle(blockerProfile.id, blockedProfile.id);

        // Assert
        expect(result.message).toBe("Profile blocked successfully");
        expect(mockProfileInteractionRepository.findOne).toHaveBeenCalledTimes(3);
        expect(mockProfileInteractionRepository.remove).toHaveBeenCalledTimes(2);
    });

    it("should throw NotFoundError when blocker profile does not exist", async () => {
        // Arrange
        const blockerProfileId = zocker(idDto).generate();
        const blockedProfileId = zocker(idDto).generate();

        mockInteractionValidator.assertProfileExists = mock(() => {
            throw new NotFoundError(`Profile with id ${blockerProfileId} not found`);
        });

        // Act & Assert
        expect(handler.handle(blockerProfileId, blockedProfileId))
            .rejects.toThrow(NotFoundError);
    });

    it("should throw NotFoundError when blocked profile does not exist", async () => {
        // Arrange
        const blockerProfile = zocker(profileDto).generate();
        const blockedProfile = zocker(profileDto).generate();

        mockInteractionValidator.assertProfileExists = mock((profileId: string) => {
            if (profileId === blockerProfile.id) return Promise.resolve(blockerProfile);
            throw new NotFoundError(`Profile with id ${blockedProfile.id} not found`);
        });

        // Act & Assert
        expect(handler.handle(blockerProfile.id, blockedProfile.id))
            .rejects.toThrow(NotFoundError);
    });

    it("should throw ConflictError when already blocked", async () => {
        // Arrange
        const blockerProfile = zocker(profileDto).generate();
        const blockedProfile = zocker(profileDto).generate();
    
        const existingBlock = { 
            id: "existing-block-id",
            sourceProfile: blockerProfile,
            targetProfile: blockedProfile,
            interactionType: ProfileInteractionType.Block,
            createdAt: new Date()
        } as ProfileInteraction;

        mockInteractionValidator.assertProfileExists = mock((profileId: string) => {
            if (profileId === blockerProfile.id) return Promise.resolve(blockerProfile);
            if (profileId === blockedProfile.id) return Promise.resolve(blockedProfile);
            return Promise.resolve({ id: profileId } as Profile);
        });

        mockProfileInteractionRepository.findOne = mock(() => Promise.resolve(existingBlock));

        // Act & Assert
        expect(handler.handle(blockerProfile.id, blockedProfile.id))
            .rejects.toThrow(ConflictError);
        expect(handler.handle(blockerProfile.id, blockedProfile.id))
            .rejects.toThrow("Profile is already blocked");
        expect(mockProfileInteractionRepository.create).not.toHaveBeenCalled();
    });
});
