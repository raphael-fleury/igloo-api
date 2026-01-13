import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Repository } from "typeorm";
import { zocker } from "zocker";
import { GetFollowingFeedHandler } from "../get-following-feed.handler";
import { postDto } from "@/app/dtos/post.dtos";
import { Post } from "@/database/entities/post";

describe("GetFollowingFeedHandler", () => {
    let handler: GetFollowingFeedHandler;
    let mockRepository: Repository<Post>;
    let qb: any;
    let rawEntitiesReturn: { entities: any[]; raw: any[] };

    beforeEach(() => {
        rawEntitiesReturn = { entities: [], raw: [] };

        qb = {
            apply: mock(() => qb),
            take: mock(() => qb),
            getRawAndEntities: mock(() => Promise.resolve(rawEntitiesReturn)),
        };

        mockRepository = {
            createQueryBuilder: mock(() => qb),
        } as any;

        handler = new GetFollowingFeedHandler(mockRepository);
    });

    it("should return following feed posts", async () => {
        const profileId = "profile-id";

        const p1Data = zocker(postDto).generate();
        const p2Data = zocker(postDto).generate();

        const p1 = { ...p1Data, user: { id: "user-1" }, profile: { ...p1Data.profile, createdAt: new Date(), updatedAt: new Date() }, repliedPost: undefined, quotedPost: undefined };
        const p2 = { ...p2Data, user: { id: "user-2" }, profile: { ...p2Data.profile, createdAt: new Date(), updatedAt: new Date() }, repliedPost: undefined, quotedPost: undefined };

        rawEntitiesReturn.entities = [p1, p2];
        rawEntitiesReturn.raw = [
            { likes: "10", reposts: "5", replies: "2", quotes: "1" },
            { likes: "0", reposts: "0", replies: "0", quotes: "0" }
        ];

        const result = await handler.handle({ profileId });

        expect(result.items.length).toBe(2);
        expect(result.items[0].id).toBe(p1.id);
        expect(result.items[0].likes).toBe(10);
        expect(result.items[1].id).toBe(p2.id);
        expect(result.items[1].likes).toBe(0);
        expect(result.hasNextPage).toBe(false);
        expect(result.count).toBe(2);

        expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith("post");
        expect(qb.apply).toHaveBeenCalled();
    });

    it("should support pagination with cursor and limit", async () => {
        const profileId = "profile-id";
        const cursor = "some-cursor-id";
        const limit = 5;
        const q = { profileId, cursor, limit };

        await handler.handle(q);

        expect(qb.apply).toHaveBeenCalled();
        expect(qb.take).toHaveBeenCalledWith(limit + 1);
    });
});

