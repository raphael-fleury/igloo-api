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
        const sourceProfile = zocker(profileDto).generate();
        const targetProfile = zocker(profileDto).generate();

        mockInteractionValidator.assertProfileExists = mock((profileId: string) => {
            if (profileId === sourceProfile.id) return Promise.resolve(sourceProfile);
            if (profileId === targetProfile.id) return Promise.resolve(targetProfile);
            return Promise.resolve({ id: profileId } as Profile);
        });

        // Act
        await handler.handle({ sourceProfileId: sourceProfile.id, targetProfileId: targetProfile.id });

        // Assert
        expect(mockProfileInteractionRepository.create).toHaveBeenCalledWith({
            sourceProfile: sourceProfile,
            targetProfile: targetProfile,
            interactionType: ProfileInteractionType.Block
        });
        expect(mockProfileInteractionRepository.save).toHaveBeenCalled();
    });

    it("should remove follows in both directions when blocking a profile", async () => {
        // Arrange
        const sourceProfile = zocker(profileDto).generate();
        const targetProfile = zocker(profileDto).generate();

        const mockFollowFromBlocker = { 
            id: zocker(idDto).generate(), 
            sourceProfile: sourceProfile, 
            targetProfile: targetProfile,
            interactionType: ProfileInteractionType.Follow
        } as ProfileInteraction;
        const mockFollowFromBlocked = { 
            id: zocker(idDto).generate(), 
            sourceProfile: targetProfile, 
            targetProfile: sourceProfile,
            interactionType: ProfileInteractionType.Follow
        } as ProfileInteraction;

        mockInteractionValidator.assertProfileExists = mock((profileId: string) => {
            if (profileId === sourceProfile.id) return Promise.resolve(sourceProfile);
            if (profileId === targetProfile.id) return Promise.resolve(targetProfile);
            return Promise.resolve({ id: profileId } as Profile);
        });

        mockProfileInteractionRepository.findOne = mock()
            .mockResolvedValueOnce(mockFollowFromBlocker)
            .mockResolvedValueOnce(mockFollowFromBlocked)
            .mockResolvedValueOnce(null); // block check

        // Act
        await handler.handle({ sourceProfileId: sourceProfile.id, targetProfileId: targetProfile.id });

        // Assert
        expect(mockProfileInteractionRepository.findOne).toHaveBeenCalledTimes(3);
        expect(mockProfileInteractionRepository.remove).toHaveBeenCalledWith(mockFollowFromBlocker);
        expect(mockProfileInteractionRepository.remove).toHaveBeenCalledWith(mockFollowFromBlocked);
    });

    it("should throw NotFoundError when blocker profile does not exist", async () => {
        // Arrange
        const sourceProfileId = zocker(idDto).generate();
        const targetProfileId = zocker(idDto).generate();

        mockInteractionValidator.assertProfileExists = mock(() => {
            throw new NotFoundError(`Profile with id ${sourceProfileId} not found`);
        });

        // Act & Assert
        expect(handler.handle({ sourceProfileId, targetProfileId }))
            .rejects.toThrow(NotFoundError);
    });

    it("should throw NotFoundError when blocked profile does not exist", async () => {
        // Arrange
        const sourceProfile = zocker(profileDto).generate();
        const targetProfile = zocker(profileDto).generate();

        mockInteractionValidator.assertProfileExists = mock((profileId: string) => {
            if (profileId === sourceProfile.id) return Promise.resolve(sourceProfile);
            throw new NotFoundError(`Profile with id ${targetProfile.id} not found`);
        });

        // Act & Assert
        expect(handler.handle({ sourceProfileId: sourceProfile.id, targetProfileId: targetProfile.id }))
            .rejects.toThrow(NotFoundError);
    });

    it("should throw ConflictError when already blocked", async () => {
        // Arrange
        const sourceProfile = zocker(profileDto).generate();
        const targetProfile = zocker(profileDto).generate();
    
        const existingBlock = { 
            id: "existing-block-id",
            sourceProfile: sourceProfile,
            targetProfile: targetProfile,
            interactionType: ProfileInteractionType.Block,
            createdAt: new Date()
        } as ProfileInteraction;

        mockInteractionValidator.assertProfileExists = mock((profileId: string) => {
            if (profileId === sourceProfile.id) return Promise.resolve(sourceProfile);
            if (profileId === targetProfile.id) return Promise.resolve(targetProfile);
            return Promise.resolve({ id: profileId } as Profile);
        });

        mockProfileInteractionRepository.findOne = mock(() => Promise.resolve(existingBlock));

        // Act & Assert
        expect(handler.handle({ sourceProfileId: sourceProfile.id, targetProfileId: targetProfile.id }))
            .rejects.toThrow(ConflictError);
        expect(mockProfileInteractionRepository.create).not.toHaveBeenCalled();
    });
});
