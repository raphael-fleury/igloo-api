import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Repository } from "typeorm";
import { zocker } from "zocker";
import { GetFollowingHandler } from "../get-following.handler";
import { Follow } from "@/database/entities/follow";
import { profileDto } from "@/app/dtos/profile.dtos";

describe("GetFollowingHandler", () => {
    let handler: GetFollowingHandler;
    let mockFollowRepository: Repository<Follow>;

    beforeEach(() => {
        mockFollowRepository = {
            find: mock(() => Promise.resolve([]))
        } as any;

        handler = new GetFollowingHandler(mockFollowRepository);
    });

    it("should return all profiles being followed successfully", async () => {
        // Arrange
        const followerProfileId = "123e4567-e89b-12d3-a456-426614174000";
        
        const followed1 = zocker(profileDto).generate();
        const followed2 = zocker(profileDto).generate();

        const follows = [
            {
                id: "follow-id-1",
                followerProfile: zocker(profileDto).generate(),
                followedProfile: followed1,
                createdAt: new Date("2024-01-01"),
                updatedAt: new Date("2024-01-01")
            } as Follow,
            {
                id: "follow-id-2",
                followerProfile: zocker(profileDto).generate(),
                followedProfile: followed2,
                createdAt: new Date("2024-01-02"),
                updatedAt: new Date("2024-01-02")
            } as Follow
        ];

        mockFollowRepository.find = mock(() => Promise.resolve(follows));

        // Act
        const result = await handler.handle(followerProfileId);

        // Assert
        expect(result.profiles).toHaveLength(2);
        expect(result.total).toBe(2);
        expect(result.profiles[0].id).toEqual(followed1.id);
        expect(result.profiles[1].id).toEqual(followed2.id);
        expect(mockFollowRepository.find).toHaveBeenCalledWith({
            where: {
                followerProfile: { id: followerProfileId }
            },
            relations: ["followedProfile"],
            order: {
                createdAt: "DESC"
            }
        });
    });

    it("should return empty array when profile is not following anyone", async () => {
        // Arrange
        const followerProfileId = "123e4567-e89b-12d3-a456-426614174000";

        mockFollowRepository.find = mock(() => Promise.resolve([]));

        // Act
        const result = await handler.handle(followerProfileId);

        // Assert
        expect(result.profiles).toEqual([]);
        expect(result.total).toBe(0);
        expect(mockFollowRepository.find).toHaveBeenCalledWith({
            where: {
                followerProfile: { id: followerProfileId }
            },
            relations: ["followedProfile"],
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
                followerProfile: zocker(profileDto).generate(),
                followedProfile: followed,
                createdAt: followDate,
                updatedAt: new Date()
            } as Follow
        ];

        mockFollowRepository.find = mock(() => Promise.resolve(follows));

        // Act
        const result = await handler.handle(followerProfileId);

        // Assert
        expect(result.profiles[0].followedAt).toEqual(followDate);
    });
});
