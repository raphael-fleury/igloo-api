import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Repository } from "typeorm";
import { zocker } from "zocker";
import { GetFollowersHandler } from "../get-followers.handler";
import { ProfileInteraction, ProfileInteractionType } from "@/database/entities/profile-interaction";
import { profileDto } from "@/app/dtos/profile.dtos";
import { idDto } from "@/app/dtos/common.dtos";

describe("GetFollowersHandler", () => {
    let handler: GetFollowersHandler;
    let mockProfileInteractionRepository: Repository<ProfileInteraction>;
    let mockQueryBuilder: any;

    beforeEach(() => {
        mockQueryBuilder = {
            leftJoinAndSelect: mock(() => mockQueryBuilder),
            where: mock(() => mockQueryBuilder),
            andWhere: mock(() => mockQueryBuilder),
            orderBy: mock(() => mockQueryBuilder),
            apply: mock((fn: any) => { fn(mockQueryBuilder); return mockQueryBuilder; }),
            take: mock(() => mockQueryBuilder),
            getMany: mock(() => Promise.resolve([])),
        };
        mockProfileInteractionRepository = {
            createQueryBuilder: mock(() => mockQueryBuilder)
        } as any;

        handler = new GetFollowersHandler(mockProfileInteractionRepository);
    });

    it("should return all followers successfully", async () => {
        const targetProfileId = zocker(idDto).generate();
        
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

        mockQueryBuilder.getMany = mock(() => Promise.resolve([...follows, { id: "follow-id-3" } as any]));

        const result = await handler.handle({ targetProfileId, limit: 2 });

        expect(result.items).toHaveLength(2);
        expect(result.count).toBe(2);
        expect(result.items[0].id).toEqual(follower1.id);
        expect(result.items[1].id).toEqual(follower2.id);
        expect(result.hasNextPage).toBeTrue();
        expect(result.nextCursor).toBe("follow-id-2");
    });
});
