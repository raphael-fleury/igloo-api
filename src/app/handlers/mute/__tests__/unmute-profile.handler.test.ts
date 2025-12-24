import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Repository } from "typeorm";
import { zocker } from "zocker";
import { UnmuteProfileHandler } from "../unmute-profile.handler";
import { ProfileInteraction, ProfileInteractionType } from "@/database/entities/profile-interaction";
import { ConflictError } from "@/app/errors";
import { profileDto } from "@/app/dtos/profile.dtos";
import { idDto } from "@/app/dtos/common.dtos";

describe("UnmuteProfileHandler", () => {
    let handler: UnmuteProfileHandler;
    let mockProfileInteractionRepository: Repository<ProfileInteraction>;

    beforeEach(() => {
        mockProfileInteractionRepository = {
            findOne: mock(() => Promise.resolve(null)),
            remove: mock(data => Promise.resolve(data))
        } as any;
        handler = new UnmuteProfileHandler(mockProfileInteractionRepository);
    });

    it("should unmute profile successfully when mute exists", async () => {
        // Arrange
        const muterProfileId = zocker(idDto).generate();
        const mutedProfileId = zocker(idDto).generate();
        
        const muterProfile = zocker(profileDto).generate();
        const mutedProfile = zocker(profileDto).generate();
        
        const existingMute = {
            id: "mute-id",
            sourceProfile: muterProfile,
            targetProfile: mutedProfile,
            interactionType: ProfileInteractionType.Mute,
            createdAt: new Date(),
            updatedAt: new Date()
        } as ProfileInteraction;

        mockProfileInteractionRepository.findOne = mock(() => Promise.resolve(existingMute));

        // Act
        await handler.handle(muterProfileId, mutedProfileId);

        // Assert
        expect(mockProfileInteractionRepository.findOne).toHaveBeenCalledWith({
            where: {
                sourceProfile: { id: muterProfileId },
                targetProfile: { id: mutedProfileId },
                interactionType: ProfileInteractionType.Mute
            }
        });
        expect(mockProfileInteractionRepository.remove).toHaveBeenCalledWith(existingMute);
    });

    it("should throw ConflictError when mute does not exist", async () => {
        // Arrange
        const muterProfileId = zocker(idDto).generate();
        const mutedProfileId = zocker(idDto).generate();

        mockProfileInteractionRepository.findOne = mock(() => Promise.resolve(null));

        // Act & Assert
        expect(handler.handle(muterProfileId, mutedProfileId)).rejects.toThrow(ConflictError);
        expect(handler.handle(muterProfileId, mutedProfileId)).rejects.toThrow(
            "Mute between profiles not found"
        );
    });

    it("should handle repository errors", async () => {
        // Arrange
        const muterProfileId = "123e4567-e89b-12d3-a456-426614174000";
        const mutedProfileId = "123e4567-e89b-12d3-a456-426614174001";
        const error = new Error("Database connection failed");

        mockProfileInteractionRepository.findOne = mock(() => Promise.reject(error));

        // Act & Assert
        expect(handler.handle(muterProfileId, mutedProfileId)).rejects.toThrow(
            "Database connection failed"
        );
    });
});
