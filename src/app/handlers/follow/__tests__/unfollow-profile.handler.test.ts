import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Repository } from "typeorm";
import { zocker } from "zocker";
import { UnfollowProfileHandler } from "../unfollow-profile.handler";
import { ProfileInteraction, ProfileInteractionType } from "@/database/entities/profile-interaction";
import { NotFoundError } from "@/app/errors";
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
        const followerProfileId = "123e4567-e89b-12d3-a456-426614174000";
        const followedProfileId = "123e4567-e89b-12d3-a456-426614174001";
        
        const followerProfile = zocker(profileDto).generate();
        const followedProfile = zocker(profileDto).generate();

        const existingFollow = {
            id: "follow-id",
            sourceProfile: followerProfile,
            targetProfile: followedProfile,
            interactionType: ProfileInteractionType.Follow,
            createdAt: new Date(),
            updatedAt: new Date()
        } as ProfileInteraction;

        mockProfileInteractionRepository.findOne = mock(() => Promise.resolve(existingFollow));

        // Act
        const result = await handler.handle(followerProfileId, followedProfileId);

        // Assert
        expect(result.message).toBe("Profile unfollowed successfully");
        expect(result.unfollowedAt).toBeDefined();
        expect(mockProfileInteractionRepository.remove).toHaveBeenCalledWith(existingFollow);
        expect(mockProfileInteractionRepository.findOne).toHaveBeenCalledWith({
            where: {
                sourceProfile: { id: followerProfileId },
                targetProfile: { id: followedProfileId },
                interactionType: ProfileInteractionType.Follow
            }
        });
    });

    it("should throw NotFoundError when follow relationship does not exist", async () => {
        // Arrange
        const followerProfileId = "123e4567-e89b-12d3-a456-426614174000";
        const followedProfileId = "123e4567-e89b-12d3-a456-426614174001";

        mockProfileInteractionRepository.findOne = mock(() => Promise.resolve(null));

        // Act & Assert
        expect(handler.handle(followerProfileId, followedProfileId)).rejects.toThrow(NotFoundError);
        expect(handler.handle(followerProfileId, followedProfileId)).rejects.toThrow(
            "Follow between profiles not found"
        );
        expect(mockProfileInteractionRepository.remove).not.toHaveBeenCalled();
    });
});
