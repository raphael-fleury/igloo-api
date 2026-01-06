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
    let mockQueryBuilder: any;

    beforeEach(() => {
        mockQueryBuilder = {
            leftJoinAndSelect: mock(() => mockQueryBuilder),
            where: mock(() => mockQueryBuilder),
            andWhere: mock(() => mockQueryBuilder),
            orderBy: mock(() => mockQueryBuilder),
            take: mock(() => mockQueryBuilder),
            getMany: mock(() => Promise.resolve([])),
        };
        mockProfileInteractionRepository = {
            createQueryBuilder: mock(() => mockQueryBuilder)
        } as any;

        handler = new GetBlockedProfilesHandler(mockProfileInteractionRepository);
    });

    it("should return blocked profiles successfully", async () => {
        const sourceProfileId = zocker(idDto).generate();
        const mockTargetProfile1 = zocker(profileDto).generate();
        const mockTargetProfile2 = zocker(profileDto).generate();

        const mockBlocks = [
            {
                id: "block-1",
                targetProfile: mockTargetProfile1,
                interactionType: ProfileInteractionType.Block,
                createdAt: new Date("2023-01-01")
            },
            {
                id: "block-2",
                targetProfile: mockTargetProfile2,
                interactionType: ProfileInteractionType.Block,
                createdAt: new Date("2023-01-02")
            }
        ] as ProfileInteraction[];

        mockQueryBuilder.getMany = mock(() => Promise.resolve([...mockBlocks, { id: "block-3" } as any]));

        const result = await handler.handle({ sourceProfileId, limit: 2 });

        expect(result.count).toBe(mockBlocks.length);
        expect(result.items).toHaveLength(2);
        expect(result.items[0]).toEqual({ ...mockTargetProfile1, blockedAt: new Date("2023-01-01") });
        expect(result.items[1]).toEqual({ ...mockTargetProfile2, blockedAt: new Date("2023-01-02") });
        expect(result.hasNextPage).toBeTrue();
        expect(result.nextCursor).toBe("block-2");
    });
});
