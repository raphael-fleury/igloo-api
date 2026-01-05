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
        const sourceProfileId = zocker(idDto).generate();
        
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
        const result = await handler.handle({ sourceProfileId });

        // Assert
        expect(result.profiles).toHaveLength(2);
        expect(result.total).toBe(2);
        expect(result.profiles[0].id).toEqual(followed1.id);
        expect(result.profiles[1].id).toEqual(followed2.id);
        expect(mockProfileInteractionRepository.find).toHaveBeenCalledWith({
            where: {
                sourceProfile: { id: sourceProfileId },
                interactionType: ProfileInteractionType.Follow
            },
            relations: ["targetProfile"],
            order: {
                createdAt: "DESC"
            }
        });
    });
});
