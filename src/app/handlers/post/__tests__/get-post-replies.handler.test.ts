import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Repository } from "typeorm";
import { zocker } from "zocker";
import { GetPostRepliesHandler } from "../get-post-replies.handler";
import { postDto } from "@/app/dtos/post.dtos";
import { Post } from "@/database/entities/post";

describe("GetPostRepliesHandler", () => {
    let handler: GetPostRepliesHandler;
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

        handler = new GetPostRepliesHandler(mockRepository);
    });

    it("should return post replies", async () => {
        // Arrange
        const postId = "post-id";
        const p1Data = zocker(postDto).generate();
        const p2Data = zocker(postDto).generate();
        
        const p1 = { ...p1Data, user: { id: "user-1" }, profile: { ...p1Data.profile, createdAt: new Date(), updatedAt: new Date() }, repliedPost: undefined, quotedPost: undefined };
        const p2 = { ...p2Data, user: { id: "user-2" }, profile: { ...p2Data.profile, createdAt: new Date(), updatedAt: new Date() }, repliedPost: undefined, quotedPost: undefined };

        rawEntitiesReturn.entities = [p1, p2];
        rawEntitiesReturn.raw = [
            { likes: "10", reposts: "5", replies: "2", quotes: "1" },
            { likes: "0", reposts: "0", replies: "0", quotes: "0" }
        ];

        // Act
        const result = await handler.handle({ postId });

        // Assert
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
        // Arrange
        const postId = "post-id";
        const cursor = "some-cursor-id";
        const limit = 5;
        const q = { postId, cursor, limit };

        // Act
        await handler.handle(q);

        // Assert
        expect(qb.apply).toHaveBeenCalled();
        expect(qb.take).toHaveBeenCalledWith(limit + 1);
    });
});
