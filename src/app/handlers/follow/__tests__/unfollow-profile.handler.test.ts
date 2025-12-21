import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Repository } from "typeorm";
import { zocker } from "zocker";
import { UnfollowProfileHandler } from "../unfollow-profile.handler";
import { Follow } from "@/database/entities/follow";
import { NotFoundError } from "@/app/errors";
import { profileDto } from "@/app/dtos/profile.dtos";

describe("UnfollowProfileHandler", () => {
    let handler: UnfollowProfileHandler;
    let mockFollowRepository: Repository<Follow>;

    beforeEach(() => {
        mockFollowRepository = {
            findOne: mock(() => Promise.resolve(null)),
            remove: mock(data => Promise.resolve(data))
        } as any;

        handler = new UnfollowProfileHandler(mockFollowRepository);
    });

    it("should unfollow profile successfully when follow exists", async () => {
        // Arrange
        const followerProfileId = "123e4567-e89b-12d3-a456-426614174000";
        const followedProfileId = "123e4567-e89b-12d3-a456-426614174001";
        
        const followerProfile = zocker(profileDto).generate();
        const followedProfile = zocker(profileDto).generate();

        const existingFollow = {
            id: "follow-id",
            followerProfile,
            followedProfile,
            createdAt: new Date(),
            updatedAt: new Date()
        } as Follow;

        mockFollowRepository.findOne = mock(() => Promise.resolve(existingFollow));

        // Act
        const result = await handler.handle(followerProfileId, followedProfileId);

        // Assert
        expect(result.message).toBe("Profile unfollowed successfully");
        expect(result.unfollowedAt).toBeDefined();
        expect(mockFollowRepository.remove).toHaveBeenCalledWith(existingFollow);
    });

    it("should throw NotFoundError when follow relationship does not exist", async () => {
        // Arrange
        const followerProfileId = "123e4567-e89b-12d3-a456-426614174000";
        const followedProfileId = "123e4567-e89b-12d3-a456-426614174001";

        mockFollowRepository.findOne = mock(() => Promise.resolve(null));

        // Act & Assert
        expect(handler.handle(followerProfileId, followedProfileId)).rejects.toThrow(NotFoundError);
        expect(handler.handle(followerProfileId, followedProfileId)).rejects.toThrow(
            "Follow between profiles not found"
        );
        expect(mockFollowRepository.remove).not.toHaveBeenCalled();
    });
});
