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
        const sourceProfileId = zocker(idDto).generate();
        const targetProfileId = zocker(idDto).generate();
        
        const sourceProfile = zocker(profileDto).generate();
        const targetProfile = zocker(profileDto).generate();
        
        const existingMute = {
            id: "mute-id",
            sourceProfile: sourceProfile,
            targetProfile: targetProfile,
            interactionType: ProfileInteractionType.Mute,
            createdAt: new Date(),
            updatedAt: new Date()
        } as ProfileInteraction;

        mockProfileInteractionRepository.findOne = mock(() => Promise.resolve(existingMute));

        // Act
        await handler.handle({ sourceProfileId, targetProfileId });

        // Assert
        expect(mockProfileInteractionRepository.findOne).toHaveBeenCalledWith({
            where: {
                sourceProfile: { id: sourceProfileId },
                targetProfile: { id: targetProfileId },
                interactionType: ProfileInteractionType.Mute
            }
        });
        expect(mockProfileInteractionRepository.remove).toHaveBeenCalledWith(existingMute);
    });

    it("should throw ConflictError when mute does not exist", async () => {
        // Arrange
        const sourceProfileId = zocker(idDto).generate();
        const targetProfileId = zocker(idDto).generate();

        mockProfileInteractionRepository.findOne = mock(() => Promise.resolve(null));

        // Act & Assert
        expect(handler.handle({ sourceProfileId, targetProfileId })).rejects.toThrow(ConflictError);
        expect(handler.handle({ sourceProfileId, targetProfileId })).rejects.toThrow(
            "Mute between profiles not found"
        );
    });
});
