import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Repository } from "typeorm";
import { zocker } from "zocker";
import { GetTrendingFeedHandler } from "../get-trending-feed.handler";
import { postDto } from "@/app/dtos/post.dtos";
import { Post } from "@/database/entities/post";

describe("GetTrendingFeedHandler", () => {
    let handler: GetTrendingFeedHandler;
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

        handler = new GetTrendingFeedHandler(mockRepository);
    });

    it("should return trending feed posts", async () => {
        const p1Data = zocker(postDto).generate();
        const p2Data = zocker(postDto).generate();

        const p1 = { ...p1Data, user: { id: "user-1" }, profile: { ...p1Data.profile, createdAt: new Date(), updatedAt: new Date() }, repliedPost: undefined, quotedPost: undefined };
        const p2 = { ...p2Data, user: { id: "user-2" }, profile: { ...p2Data.profile, createdAt: new Date(), updatedAt: new Date() }, repliedPost: undefined, quotedPost: undefined };

        rawEntitiesReturn.entities = [p1, p2];
        rawEntitiesReturn.raw = [
            { likes: "10", reposts: "5", replies: "2", quotes: "1" },
            { likes: "3", reposts: "1", replies: "0", quotes: "0" }
        ];

        const result = await handler.handle({});

        expect(result.items.length).toBe(2);
        expect(result.items[0].id).toBe(p1.id);
        expect(result.items[0].likes).toBe(10);
        expect(result.items[1].id).toBe(p2.id);
        expect(result.items[1].likes).toBe(3);
        expect(result.hasNextPage).toBe(false);
        expect(result.count).toBe(2);

        expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith("post");
        expect(qb.apply).toHaveBeenCalled();
    });

    it("should support pagination with cursor and limit", async () => {
        const cursor = "some-cursor-id";
        const limit = 5;
        const q = { cursor, limit };

        await handler.handle(q);

        expect(qb.apply).toHaveBeenCalled();
        expect(qb.take).toHaveBeenCalledWith(limit + 1);
    });

    it("should generate correct cursor for next page", async () => {
        const posts = Array.from({ length: 11 }, () => {
            const p = zocker(postDto).generate();
            return {
                ...p,
                user: { id: p.profile.userId },
                profile: { ...p.profile, createdAt: new Date(), updatedAt: new Date() },
                repliedPost: undefined,
                quotedPost: undefined
            };
        });

        rawEntitiesReturn.entities = posts;
        rawEntitiesReturn.raw = posts.map(() => ({
            likes: "10", reposts: "5", replies: "2", quotes: "1"
        }));

        const result = await handler.handle({ limit: 10 });

        expect(result.hasNextPage).toBe(true);
        expect(result.items.length).toBe(10);
        
        const lastItem = result.items[9];
        expect(result.nextCursor).toBe(lastItem.id);
    });

    it("should clamp requested limit to MAX_LIMIT", async () => {
        await handler.handle({ limit: 999 });
        expect(qb.take).toHaveBeenCalledWith(21);
    });
});
