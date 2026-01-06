import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Repository } from "typeorm";
import { zocker } from "zocker";
import { GetProfilesHandler } from "../get-profiles.handler";
import { Profile } from "@/database/entities/profile";
import { profileDto } from "@/app/dtos/profile.dtos";
import { PageQueryDto } from "@/app/dtos/common.dtos";

describe("GetProfilesHandler", () => {
    let handler: GetProfilesHandler;
    let mockRepository: Repository<Profile>;
    let mockQueryBuilder: any;

    beforeEach(() => {
        mockQueryBuilder = {
            orderBy: mock(() => mockQueryBuilder),
            take: mock(() => mockQueryBuilder),
            andWhere: mock(() => mockQueryBuilder),
            getMany: mock(() => Promise.resolve([])),
        };
        mockRepository = {
            createQueryBuilder: mock(() => mockQueryBuilder),
        } as any;
        handler = new GetProfilesHandler(mockRepository);
    });

    it("should return paginated profiles", async () => {
        const mockProfile1 = zocker(profileDto).generate();
        const mockProfile2 = zocker(profileDto).generate();
        const mockProfile3 = zocker(profileDto).generate();
        const mockProfiles = [mockProfile1, mockProfile2, mockProfile3] as Profile[];
        mockQueryBuilder.getMany = mock(() => Promise.resolve(mockProfiles));

        const query: PageQueryDto = { limit: 2 };
        const result = await handler.handle(query);

        expect(result.items).toHaveLength(2);
        expect(result.items[0]).toEqual(mockProfile1);
        expect(result.items[1]).toEqual(mockProfile2);
        expect(result.count).toBe(2);
        expect(result.hasNextPage).toBeTrue();
        expect(result.nextCursor).toBe(mockProfile2.id);
    });
});
