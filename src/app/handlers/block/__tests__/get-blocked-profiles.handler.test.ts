import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Repository } from "typeorm";
import { zocker } from "zocker";
import { GetBlockedProfilesHandler } from "../get-blocked-profiles.handler";
import { ProfileInteraction, ProfileInteractionType } from "@/database/entities/profile-interaction";
import { profileDto } from "@/app/dtos/profile.dtos";
import { idDto } from "@/app/dtos/common.dtos";

describe("GetBlockedProfilesHandler", () => {
    let handler: GetBlockedProfilesHandler;
    let mockProfileInteractionRepository: Repository<ProfileInteraction>;

    beforeEach(() => {
        mockProfileInteractionRepository = {
            find: mock(() => Promise.resolve([]))
        } as any;

        handler = new GetBlockedProfilesHandler(mockProfileInteractionRepository);
    });

    it("should return blocked profiles successfully", async () => {
        // Arrange
        const blockerProfileId = zocker(idDto).generate();
        const mockBlockedProfile1 = zocker(profileDto).generate();
        const mockBlockedProfile2 = zocker(profileDto).generate();

        const mockBlocks = [
            {
                id: "block-1",
                targetProfile: mockBlockedProfile1,
                interactionType: ProfileInteractionType.Block,
                createdAt: new Date("2023-01-01")
            },
            {
                id: "block-2",
                targetProfile: mockBlockedProfile2,
                interactionType: ProfileInteractionType.Block,
                createdAt: new Date("2023-01-02")
            }
        ] as ProfileInteraction[];

        mockProfileInteractionRepository.find = mock(() => Promise.resolve(mockBlocks));

        // Act
        const result = await handler.handle(blockerProfileId);

        // Assert
        expect(result.total).toBe(mockBlocks.length);
        expect(result.profiles).toHaveLength(2);
        expect(result.profiles[0]).toEqual({ ...mockBlockedProfile1, blockedAt: new Date("2023-01-01") });
        expect(result.profiles[1]).toEqual({ ...mockBlockedProfile2, blockedAt: new Date("2023-01-02") });
        expect(mockProfileInteractionRepository.find).toHaveBeenCalledWith({
            where: {
                sourceProfile: { id: blockerProfileId },
                interactionType: ProfileInteractionType.Block
            },
            relations: ["targetProfile"],
            order: {
                createdAt: "DESC"
            }
        });
    });
});
