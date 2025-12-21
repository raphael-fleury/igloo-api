import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Repository } from "typeorm";
import { zocker } from "zocker";
import { GetFollowersHandler } from "../get-followers.handler";
import { Follow } from "@/database/entities/follow";
import { profileDto } from "@/app/dtos/profile.dtos";

describe("GetFollowersHandler", () => {
    let handler: GetFollowersHandler;
    let mockFollowRepository: Repository<Follow>;

    beforeEach(() => {
        mockFollowRepository = {
            find: mock(() => Promise.resolve([]))
        } as any;

        handler = new GetFollowersHandler(mockFollowRepository);
    });

    it("should return all followers successfully", async () => {
        // Arrange
        const followedProfileId = "123e4567-e89b-12d3-a456-426614174000";
        
        const follower1 = zocker(profileDto).generate();
        const follower2 = zocker(profileDto).generate();

        const follows = [
            {
                id: "follow-id-1",
                followerProfile: follower1,
                followedProfile: zocker(profileDto).generate(),
                createdAt: new Date("2024-01-01"),
                updatedAt: new Date("2024-01-01")
            } as Follow,
            {
                id: "follow-id-2",
                followerProfile: follower2,
                followedProfile: zocker(profileDto).generate(),
                createdAt: new Date("2024-01-02"),
                updatedAt: new Date("2024-01-02")
            } as Follow
        ];

        mockFollowRepository.find = mock(() => Promise.resolve(follows));

        // Act
        const result = await handler.handle(followedProfileId);

        // Assert
        expect(result.profiles).toHaveLength(2);
        expect(result.total).toBe(2);
        expect(result.profiles[0].id).toEqual(follower1.id);
        expect(result.profiles[1].id).toEqual(follower2.id);
        expect(mockFollowRepository.find).toHaveBeenCalledWith({
            where: {
                followedProfile: { id: followedProfileId }
            },
            relations: ["followerProfile"],
            order: {
                createdAt: "DESC"
            }
        });
    });

    it("should return empty array when profile has no followers", async () => {
        // Arrange
        const followedProfileId = "123e4567-e89b-12d3-a456-426614174000";

        mockFollowRepository.find = mock(() => Promise.resolve([]));

        // Act
        const result = await handler.handle(followedProfileId);

        // Assert
        expect(result.profiles).toEqual([]);
        expect(result.total).toBe(0);
        expect(mockFollowRepository.find).toHaveBeenCalledWith({
            where: {
                followedProfile: { id: followedProfileId }
            },
            relations: ["followerProfile"],
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
                followerProfile: follower,
                followedProfile: zocker(profileDto).generate(),
                createdAt: followDate,
                updatedAt: new Date()
            } as Follow
        ];

        mockFollowRepository.find = mock(() => Promise.resolve(follows));

        // Act
        const result = await handler.handle(followedProfileId);

        // Assert
        expect(result.profiles[0].followedAt).toEqual(followDate);
    });
});
