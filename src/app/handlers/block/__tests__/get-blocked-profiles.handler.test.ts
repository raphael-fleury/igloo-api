import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Repository } from "typeorm";
import { GetBlockedProfilesHandler } from "../get-blocked-profiles.handler";
import { Block } from "@/database/entities/block";
import { zocker } from "zocker";
import { profileDto } from "@/app/dtos/profile.dtos";

describe("GetBlockedProfilesHandler", () => {
    let handler: GetBlockedProfilesHandler;
    let mockBlockRepository: Repository<Block>;

    beforeEach(() => {
        mockBlockRepository = {
            find: mock(() => Promise.resolve([]))
        } as any;

        handler = new GetBlockedProfilesHandler(mockBlockRepository);
    });

    it("should return blocked profiles successfully", async () => {
        // Arrange
        const blockerProfileId = "blocker-id";
        const mockBlockedProfile1 = zocker(profileDto).generate();
        const mockBlockedProfile2 = zocker(profileDto).generate();

        const mockBlocks = [
            {
                id: "block-1",
                blockedProfile: mockBlockedProfile1,
                createdAt: new Date("2023-01-01")
            },
            {
                id: "block-2",
                blockedProfile: mockBlockedProfile2,
                createdAt: new Date("2023-01-02")
            }
        ] as Block[];

        mockBlockRepository.find = mock(() => Promise.resolve(mockBlocks));

        // Act
        const result = await handler.handle(blockerProfileId);

        // Assert
        expect(result.total).toBe(2);
        expect(result.profiles).toHaveLength(2);
        expect(result.profiles[0]).toEqual({ ...mockBlockedProfile1, blockedAt: new Date("2023-01-01") });
        expect(result.profiles[1]).toEqual({ ...mockBlockedProfile2, blockedAt: new Date("2023-01-02") });
        expect(mockBlockRepository.find).toHaveBeenCalledWith({
            where: {
                blockerProfile: { id: blockerProfileId }
            },
            relations: ["blockedProfile"],
            order: {
                createdAt: "DESC"
            }
        });
    });

    it("should return empty list when no blocked profiles", async () => {
        // Arrange
        const blockerProfileId = "blocker-id";
        mockBlockRepository.find = mock(() => Promise.resolve([]));

        // Act
        const result = await handler.handle(blockerProfileId);

        // Assert
        expect(result.total).toBe(0);
        expect(result.profiles).toHaveLength(0);
    });
});