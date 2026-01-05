import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Repository } from "typeorm";
import { zocker } from "zocker";
import { MuteProfileHandler } from "../mute-profile.handler";
import { ProfileInteraction, ProfileInteractionType } from "@/database/entities/profile-interaction";
import { Profile } from "@/database/entities/profile";
import { NotFoundError, SelfInteractionError, ConflictError } from "@/app/errors";
import { profileDto } from "@/app/dtos/profile.dtos";
import { InteractionValidator } from "@/app/validators/interaction.validator";
import { idDto } from "@/app/dtos/common.dtos";

describe("MuteProfileHandler", () => {
    let handler: MuteProfileHandler;
    let mockProfileInteractionRepository: Repository<ProfileInteraction>;
    let mockProfileRepository: Repository<Profile>;
    let mockInteractionValidator: InteractionValidator;

    beforeEach(() => {
        mockProfileInteractionRepository = {
            findOne: mock(() => Promise.resolve(null)),
            create: mock(data => data),
            save: mock(data => Promise.resolve(data))
        } as any;

        mockProfileRepository = {
            findOneBy: mock(() => Promise.resolve(null))
        } as any;

        mockInteractionValidator = {
            assertProfilesAreNotSame: mock(() => Promise.resolve()),
            assertProfileExists: mock(() => Promise.resolve({ id: "profile-id" } as Profile))
        } as any;

        handler = new MuteProfileHandler(mockProfileInteractionRepository, mockProfileRepository, mockInteractionValidator);
    });

    it("should mute profile successfully when both profiles exist", async () => {
        // Arrange
        const sourceProfileId = zocker(idDto).generate();
        const targetProfileId = zocker(idDto).generate();
        
        const sourceProfile = zocker(profileDto).generate();
        const targetProfile = zocker(profileDto).generate();

        const createdMute = {
            id: "mute-id",
            sourceProfile: sourceProfile,
            targetProfile: targetProfile,
            interactionType: ProfileInteractionType.Mute,
            createdAt: new Date(),
            updatedAt: new Date()
        } as ProfileInteraction;

        mockInteractionValidator.assertProfileExists = mock()
            .mockResolvedValueOnce(sourceProfile)
            .mockResolvedValueOnce(targetProfile);

        mockProfileInteractionRepository.findOne = mock(() => Promise.resolve(null));
        mockProfileInteractionRepository.save = mock(() => Promise.resolve(createdMute)) as any;

        // Act
        await handler.handle({ sourceProfileId, targetProfileId });

        // Assert
        expect(mockProfileInteractionRepository.save).toHaveBeenCalled();
    });

    it("should throw NotFoundError when muter profile does not exist", async () => {
        // Arrange
        const sourceProfileId = "123e4567-e89b-12d3-a456-426614174000";
        const targetProfileId = "123e4567-e89b-12d3-a456-426614174001";

        mockInteractionValidator.assertProfileExists = mock(() => {
            throw new NotFoundError(`Profile with id ${sourceProfileId} not found`);
        });

        // Act & Assert
        expect(handler.handle({ sourceProfileId, targetProfileId })).rejects.toThrow(NotFoundError);
    });

    it("should throw NotFoundError when muted profile does not exist", async () => {
        // Arrange
        const sourceProfileId = zocker(idDto).generate();
        const targetProfileId = zocker(idDto).generate();
        
        const sourceProfile = zocker(profileDto).generate();

        mockInteractionValidator.assertProfileExists = mock((profileId: string) => {
            if (profileId === sourceProfileId) {
                return Promise.resolve(sourceProfile);
            }
            throw new NotFoundError(`Profile with id ${targetProfileId} not found`);
        });

        // Act & Assert
        expect(handler.handle({ sourceProfileId, targetProfileId })).rejects.toThrow(NotFoundError);
    });

    it("should throw ConflictError when already muted", async () => {
        // Arrange
        const sourceProfileId = zocker(idDto).generate();
        const targetProfileId = zocker(idDto).generate();
        
        const sourceProfile = zocker(profileDto).generate();
        const targetProfile = zocker(profileDto).generate();
        const existingMute = {
            id: "mute-id",
            sourceProfile: sourceProfile,
            targetProfile: targetProfile,
            interactionType: ProfileInteractionType.Mute,
            createdAt: new Date("2024-01-01"),
            updatedAt: new Date("2024-01-01")
        } as ProfileInteraction;

        mockInteractionValidator.assertProfileExists = mock()
            .mockResolvedValueOnce(sourceProfile)
            .mockResolvedValueOnce(targetProfile);

        mockProfileInteractionRepository.findOne = mock(() => Promise.resolve(existingMute));

        // Act & Assert
        expect(handler.handle({ sourceProfileId, targetProfileId }))
            .rejects.toThrow(ConflictError);
        expect(handler.handle({ sourceProfileId, targetProfileId }))
            .rejects.toThrow("Profile is already muted");
        expect(mockProfileInteractionRepository.save).not.toHaveBeenCalled();
    });

    it("should throw SelfInteractionError when trying to mute the same profile", async () => {
        // Arrange
        const profileId = zocker(idDto).generate();

        mockInteractionValidator.assertProfilesAreNotSame = mock(() => {
            throw new SelfInteractionError("A profile cannot interact with itself");
        });

        // Act & Assert
        expect(handler.handle({ sourceProfileId: profileId, targetProfileId: profileId })).rejects.toThrow(SelfInteractionError);
        expect(mockInteractionValidator.assertProfileExists).not.toHaveBeenCalled();
    });
});
