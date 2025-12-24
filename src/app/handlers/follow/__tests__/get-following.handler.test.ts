import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Repository } from "typeorm";
import { zocker } from "zocker";
import { GetFollowingHandler } from "../get-following.handler";
import { ProfileInteraction, ProfileInteractionType } from "@/database/entities/profile-interaction";
import { profileDto } from "@/app/dtos/profile.dtos";
import { idDto } from "@/app/dtos/common.dtos";

describe("GetFollowingHandler", () => {
    let handler: GetFollowingHandler;
    let mockProfileInteractionRepository: Repository<ProfileInteraction>;

    beforeEach(() => {
        mockProfileInteractionRepository = {
            find: mock(() => Promise.resolve([]))
        } as any;

        handler = new GetFollowingHandler(mockProfileInteractionRepository);
    });

    it("should return all profiles being followed successfully", async () => {
        // Arrange
        const followerProfileId = zocker(idDto).generate();
        
        const followed1 = zocker(profileDto).generate();
        const followed2 = zocker(profileDto).generate();

        const follows = [
            {
                id: "follow-id-1",
                sourceProfile: zocker(profileDto).generate(),
                targetProfile: followed1,
                interactionType: ProfileInteractionType.Follow,
                createdAt: new Date("2024-01-01"),
                updatedAt: new Date("2024-01-01")
            } as ProfileInteraction,
            {
                id: "follow-id-2",
                sourceProfile: zocker(profileDto).generate(),
                targetProfile: followed2,
                interactionType: ProfileInteractionType.Follow,
                createdAt: new Date("2024-01-02"),
                updatedAt: new Date("2024-01-02")
            } as ProfileInteraction
        ];

        mockProfileInteractionRepository.find = mock(() => Promise.resolve(follows));

        // Act
        const result = await handler.handle(followerProfileId);

        // Assert
        expect(result.profiles).toHaveLength(2);
        expect(result.total).toBe(2);
        expect(result.profiles[0].id).toEqual(followed1.id);
        expect(result.profiles[1].id).toEqual(followed2.id);
        expect(mockProfileInteractionRepository.find).toHaveBeenCalledWith({
            where: {
                sourceProfile: { id: followerProfileId },
                interactionType: ProfileInteractionType.Follow
            },
            relations: ["targetProfile"],
            order: {
                createdAt: "DESC"
            }
        });
    });

    it("should return empty array when profile is not following anyone", async () => {
        // Arrange
        const followerProfileId = "123e4567-e89b-12d3-a456-426614174000";

        mockProfileInteractionRepository.find = mock(() => Promise.resolve([]));

        // Act
        const result = await handler.handle(followerProfileId);

        // Assert
        expect(result.profiles).toEqual([]);
        expect(result.total).toBe(0);
        expect(mockProfileInteractionRepository.find).toHaveBeenCalledWith({
            where: {
                sourceProfile: { id: followerProfileId },
                interactionType: ProfileInteractionType.Follow
            },
            relations: ["targetProfile"],
            order: {
                createdAt: "DESC"
            }
        });
    });

    it("should include followedAt timestamp for each followed profile", async () => {
        // Arrange
        const followerProfileId = "123e4567-e89b-12d3-a456-426614174000";
        const followed = zocker(profileDto).generate();
        const followDate = new Date("2024-01-01");

        const follows = [
            {
                id: "follow-id",
                sourceProfile: zocker(profileDto).generate(),
                targetProfile: followed,
                interactionType: ProfileInteractionType.Follow,
                createdAt: followDate,
                updatedAt: new Date()
            } as ProfileInteraction
        ];

        mockProfileInteractionRepository.find = mock(() => Promise.resolve(follows));

        // Act
        const result = await handler.handle(followerProfileId);

        // Assert
        expect(result.profiles[0].followedAt).toEqual(followDate);
    });
});
