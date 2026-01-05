import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Repository } from "typeorm";
import { zocker } from "zocker";
import { UnfollowProfileHandler } from "../unfollow-profile.handler";
import { ProfileInteraction, ProfileInteractionType } from "@/database/entities/profile-interaction";
import { ConflictError } from "@/app/errors";
import { profileDto } from "@/app/dtos/profile.dtos";

describe("UnfollowProfileHandler", () => {
    let handler: UnfollowProfileHandler;
    let mockProfileInteractionRepository: Repository<ProfileInteraction>;

    beforeEach(() => {
        mockProfileInteractionRepository = {
            findOne: mock(() => Promise.resolve(null)),
            remove: mock(data => Promise.resolve(data))
        } as any;

        handler = new UnfollowProfileHandler(mockProfileInteractionRepository);
    });

    it("should unfollow profile successfully when follow exists", async () => {
        // Arrange
        const sourceProfileId = "123e4567-e89b-12d3-a456-426614174000";
        const targetProfileId = "123e4567-e89b-12d3-a456-426614174001";
        
        const sourceProfile = zocker(profileDto).generate();
        const targetProfile = zocker(profileDto).generate();
        sourceProfile.id = sourceProfileId;
        targetProfile.id = targetProfileId;

        const existingFollow = {
            id: "follow-id",
            sourceProfile: sourceProfile,
            targetProfile: targetProfile,
            interactionType: ProfileInteractionType.Follow,
            createdAt: new Date(),
            updatedAt: new Date()
        } as ProfileInteraction;

        mockProfileInteractionRepository.findOne = mock(() => Promise.resolve(existingFollow));

        // Act
        await handler.handle({ sourceProfileId, targetProfileId });

        // Assert
        expect(mockProfileInteractionRepository.remove).toHaveBeenCalledWith(existingFollow);
        expect(mockProfileInteractionRepository.findOne).toHaveBeenCalledWith({
            where: {
                sourceProfile: { id: sourceProfileId },
                targetProfile: { id: targetProfileId },
                interactionType: ProfileInteractionType.Follow
            }
        });
    });

    it("should throw ConflictError when follow relationship does not exist", async () => {
        // Arrange
        const sourceProfileId = "123e4567-e89b-12d3-a456-426614174000";
        const targetProfileId = "123e4567-e89b-12d3-a456-426614174001";

        mockProfileInteractionRepository.findOne = mock(() => Promise.resolve(null));

        // Act & Assert
        expect(handler.handle({ sourceProfileId, targetProfileId })).rejects.toThrow(ConflictError);
        expect(handler.handle({ sourceProfileId, targetProfileId })).rejects.toThrow(
            "Follow between profiles not found"
        );
        expect(mockProfileInteractionRepository.remove).not.toHaveBeenCalled();
    });
});
