import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Repository } from "typeorm";
import { zocker } from "zocker";
import { GetMutedProfilesHandler } from "../get-muted-profiles.handler";
import { ProfileInteraction, ProfileInteractionType } from "@/database/entities/profile-interaction";
import { profileDto } from "@/app/dtos/profile.dtos";
import { idDto } from "@/app/dtos/common.dtos";

describe("GetMutedProfilesHandler", () => {
    let handler: GetMutedProfilesHandler;
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
        handler = new GetMutedProfilesHandler(mockProfileInteractionRepository);
    });

    it("should return muted profiles successfully", async () => {
        const sourceProfileId = zocker(idDto).generate();
        const targetProfile = zocker(profileDto).generate();
        const mute = {
            id: "mute-id-1",
            sourceProfile: { id: sourceProfileId },
            targetProfile: targetProfile,
            interactionType: ProfileInteractionType.Mute,
            createdAt: new Date(),
            updatedAt: new Date()
        } as ProfileInteraction;

        mockQueryBuilder.getMany = mock(() => Promise.resolve([mute, { id: "mute-id-2" } as any]));

        const result = await handler.handle({ sourceProfileId, limit: 1 });

        expect(result.count).toBe(1);
        expect(result.items).toHaveLength(1);
        expect(result.items[0].username).toBe(targetProfile.username);
        expect(result.items[0].mutedAt).toEqual(mute.createdAt);
        expect(result.hasNextPage).toBeTrue();
        expect(result.nextCursor).toBe("mute-id-1");
    });
});
