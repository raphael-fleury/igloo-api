import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Repository } from "typeorm";
import { zocker } from "zocker";
import { GetPostQuotesHandler } from "../get-post-quotes.handler";
import { postDto } from "@/app/dtos/post.dtos";
import { Post } from "@/database/entities/post";

describe("GetPostQuotesHandler", () => {
    let handler: GetPostQuotesHandler;
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

        handler = new GetPostQuotesHandler(mockRepository);
    });

    it("should return post quotes", async () => {
        // Arrange
        const postId = "post-id";
        const p1Data = zocker(postDto).generate();
        const p2Data = zocker(postDto).generate();
        
        const p1 = { 
            ...p1Data, 
            user: { id: "user-1" }, 
            profile: { ...p1Data.profile, createdAt: new Date(), updatedAt: new Date() }, 
            repliedPost: undefined, 
            quotedPost: undefined 
        };
        const p2 = { 
            ...p2Data, 
            user: { id: "user-2" }, 
            profile: { ...p2Data.profile, createdAt: new Date(), updatedAt: new Date() }, 
            repliedPost: undefined, 
            quotedPost: undefined 
        };

        rawEntitiesReturn.entities = [p1, p2];
        rawEntitiesReturn.raw = [
            { likes: "15", reposts: "8", replies: "3", quotes: "2" },
            { likes: "5", reposts: "2", replies: "1", quotes: "0" }
        ];

        // Act
        const result = await handler.handle({ postId });

        // Assert
        expect(result.items.length).toBe(2);
        expect(result.items[0].id).toBe(p1.id);
        expect(result.items[0].likes).toBe(15);
        expect(result.items[0].quotes).toBe(2);
        expect(result.items[1].id).toBe(p2.id);
        expect(result.items[1].likes).toBe(5);
        expect(result.items[1].quotes).toBe(0);
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
        const command = { postId, cursor, limit };

        // Act
        await handler.handle(command);

        // Assert
        expect(qb.apply).toHaveBeenCalled();
        expect(qb.take).toHaveBeenCalledWith(limit + 1);
    });

    it("should handle empty result", async () => {
        // Arrange
        const postId = "post-id";
        rawEntitiesReturn.entities = [];
        rawEntitiesReturn.raw = [];

        // Act
        const result = await handler.handle({ postId });

        // Assert
        expect(result.items.length).toBe(0);
        expect(result.hasNextPage).toBe(false);
        expect(result.count).toBe(0);
        expect(result.nextCursor).toBeUndefined();
    });

    it("should handle pagination with next page", async () => {
        // Arrange
        const postId = "post-id";
        const limit = 2;
        const p1Data = zocker(postDto).generate();
        const p2Data = zocker(postDto).generate();
        const p3Data = zocker(postDto).generate();
        
        const p1 = { 
            ...p1Data, 
            user: { id: "user-1" }, 
            profile: { ...p1Data.profile, createdAt: new Date(), updatedAt: new Date() }, 
            repliedPost: undefined, 
            quotedPost: undefined 
        };
        const p2 = { 
            ...p2Data, 
            user: { id: "user-2" }, 
            profile: { ...p2Data.profile, createdAt: new Date(), updatedAt: new Date() }, 
            repliedPost: undefined, 
            quotedPost: undefined 
        };
        const p3 = { 
            ...p3Data, 
            user: { id: "user-3" }, 
            profile: { ...p3Data.profile, createdAt: new Date(), updatedAt: new Date() }, 
            repliedPost: undefined, 
            quotedPost: undefined 
        };

        // Return limit + 1 items to indicate next page exists
        rawEntitiesReturn.entities = [p1, p2, p3];
        rawEntitiesReturn.raw = [
            { likes: "10", reposts: "5", replies: "2", quotes: "1" },
            { likes: "5", reposts: "2", replies: "1", quotes: "0" },
            { likes: "8", reposts: "3", replies: "1", quotes: "1" }
        ];

        // Act
        const result = await handler.handle({ postId, limit });

        // Assert
        expect(result.items.length).toBe(2); // Should return only limit items
        expect(result.hasNextPage).toBe(true);
        expect(result.count).toBe(2);
        expect(result.nextCursor).toBe(p2.id); // Cursor should be the last item returned
    });

    it("should use default limit when not provided", async () => {
        // Arrange
        const postId = "post-id";

        // Act
        await handler.handle({ postId });

        // Assert
        expect(qb.take).toHaveBeenCalledWith(11); // DEFAULT_LIMIT (10) + 1
    });

    it("should respect max limit", async () => {
        // Arrange
        const postId = "post-id";
        const limit = 50; // Above MAX_LIMIT

        // Act
        await handler.handle({ postId, limit });

        // Assert
        expect(qb.take).toHaveBeenCalledWith(21); // MAX_LIMIT (20) + 1
    });
});