import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Repository } from "typeorm";
import { zocker } from "zocker";
import { GetFollowersHandler } from "../get-followers.handler";
import { ProfileInteraction, ProfileInteractionType } from "@/database/entities/profile-interaction";
import { profileDto } from "@/app/dtos/profile.dtos";

describe("GetFollowersHandler", () => {
    let handler: GetFollowersHandler;
    let mockProfileInteractionRepository: Repository<ProfileInteraction>;

    beforeEach(() => {
        mockProfileInteractionRepository = {
            find: mock(() => Promise.resolve([]))
        } as any;

        handler = new GetFollowersHandler(mockProfileInteractionRepository);
    });

    it("should return all followers successfully", async () => {
        // Arrange
        const followedProfileId = "123e4567-e89b-12d3-a456-426614174000";
        
        const follower1 = zocker(profileDto).generate();
        const follower2 = zocker(profileDto).generate();

        const follows = [
            {
                id: "follow-id-1",
                sourceProfile: follower1,
                targetProfile: zocker(profileDto).generate(),
                interactionType: ProfileInteractionType.Follow,
                createdAt: new Date("2024-01-01"),
                updatedAt: new Date("2024-01-01")
            } as ProfileInteraction,
            {
                id: "follow-id-2",
                sourceProfile: follower2,
                targetProfile: zocker(profileDto).generate(),
                interactionType: ProfileInteractionType.Follow,
                createdAt: new Date("2024-01-02"),
                updatedAt: new Date("2024-01-02")
            } as ProfileInteraction
        ];

        mockProfileInteractionRepository.find = mock(() => Promise.resolve(follows));

        // Act
        const result = await handler.handle(followedProfileId);

        // Assert
        expect(result.profiles).toHaveLength(2);
        expect(result.total).toBe(2);
        expect(result.profiles[0].id).toEqual(follower1.id);
        expect(result.profiles[1].id).toEqual(follower2.id);
        expect(mockProfileInteractionRepository.find).toHaveBeenCalledWith({
            where: {
                targetProfile: { id: followedProfileId },
                interactionType: ProfileInteractionType.Follow
            },
            relations: ["sourceProfile"],
            order: {
                createdAt: "DESC"
            }
        });
    });

    it("should return empty array when profile has no followers", async () => {
        // Arrange
        const followedProfileId = "123e4567-e89b-12d3-a456-426614174000";

        mockProfileInteractionRepository.find = mock(() => Promise.resolve([]));

        // Act
        const result = await handler.handle(followedProfileId);

        // Assert
        expect(result.profiles).toEqual([]);
        expect(result.total).toBe(0);
        expect(mockProfileInteractionRepository.find).toHaveBeenCalledWith({
            where: {
                targetProfile: { id: followedProfileId },
                interactionType: ProfileInteractionType.Follow
            },
            relations: ["sourceProfile"],
            order: {
                createdAt: "DESC"
            }
        });
    });

    it("should include followedAt timestamp for each follower", async () => {
        // Arrange
        const followedProfileId = "123e4567-e89b-12d3-a456-426614174000";
        const follower = zocker(profileDto).generate();
        const followDate = new Date("2024-01-01");

        const follows = [
            {
                id: "follow-id",
                sourceProfile: follower,
                targetProfile: zocker(profileDto).generate(),
                interactionType: ProfileInteractionType.Follow,
                createdAt: followDate,
                updatedAt: new Date()
            } as ProfileInteraction
        ];

        mockProfileInteractionRepository.find = mock(() => Promise.resolve(follows));

        // Act
        const result = await handler.handle(followedProfileId);

        // Assert
        expect(result.profiles[0].followedAt).toEqual(followDate);
    });
});
