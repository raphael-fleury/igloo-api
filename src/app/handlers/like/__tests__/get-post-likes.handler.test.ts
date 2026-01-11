import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Repository } from "typeorm";
import { zocker } from "zocker";
import { GetPostLikesHandler } from "../get-post-likes.handler";
import { profileDto } from "@/app/dtos/profile.dtos";
import { PostInteraction, InteractionType } from "@/database/entities/post-interaction";

describe("GetPostLikesHandler", () => {
    let handler: GetPostLikesHandler;
    let mockPostInteractionRepository: Repository<PostInteraction>;
    let qb: any;
    let likesReturn: any[];

    beforeEach(() => {
        likesReturn = [];

        qb = {
            leftJoinAndSelect: mock(() => qb),
            where: mock(() => qb),
            andWhere: mock(() => qb),
            orderBy: mock(() => qb),
            take: mock(() => qb),
            getMany: mock(() => Promise.resolve(likesReturn)),
        };

        mockPostInteractionRepository = {
            createQueryBuilder: mock(() => qb),
        } as any;

        handler = new GetPostLikesHandler(mockPostInteractionRepository);
    });

    it("should return post likes", async () => {
        // Arrange
        const postId = "post-id";
        const profile1Data = zocker(profileDto).generate();
        const profile2Data = zocker(profileDto).generate();
        
        const like1 = {
            id: "like-1",
            profile: { 
                ...profile1Data, 
                createdAt: new Date("2024-01-01"), 
                updatedAt: new Date("2024-01-01") 
            },
            createdAt: new Date("2024-01-01T10:00:00Z"),
            interactionType: InteractionType.Like
        } as PostInteraction;
        
        const like2 = {
            id: "like-2",
            profile: { 
                ...profile2Data, 
                createdAt: new Date("2024-01-02"), 
                updatedAt: new Date("2024-01-02") 
            },
            createdAt: new Date("2024-01-02T15:30:00Z"),
            interactionType: InteractionType.Like
        } as PostInteraction;

        likesReturn = [like1, like2];
        qb.getMany = mock(() => Promise.resolve(likesReturn));

        // Act
        const result = await handler.handle({ postId });

        // Assert
        expect(result.items.length).toBe(2);
        expect(result.items[0].id).toBe(profile1Data.id);
        expect(result.items[0].likedAt).toEqual(like1.createdAt);
        expect(result.items[1].id).toBe(profile2Data.id);
        expect(result.items[1].likedAt).toEqual(like2.createdAt);
        expect(result.hasNextPage).toBe(false);
        expect(result.count).toBe(2);
        
        expect(mockPostInteractionRepository.createQueryBuilder).toHaveBeenCalledWith("interaction");
        expect(qb.leftJoinAndSelect).toHaveBeenCalledWith("interaction.profile", "profile");
        expect(qb.where).toHaveBeenCalledWith("interaction.post.id = :postId", { postId });
        expect(qb.andWhere).toHaveBeenCalledWith("interaction.interactionType = :type", { type: InteractionType.Like });
        expect(qb.orderBy).toHaveBeenCalledWith("interaction.id", "DESC");
    });

    it("should support pagination with cursor and limit", async () => {
        // Arrange
        const postId = "post-id";
        const cursor = "some-cursor-id";
        const limit = 5;
        const query = { postId, cursor, limit };

        // Act
        await handler.handle(query);

        // Assert
        expect(qb.andWhere).toHaveBeenCalledWith("interaction.id < :cursor", { cursor });
        expect(qb.take).toHaveBeenCalledWith(limit + 1);
    });

    it("should handle empty result", async () => {
        // Arrange
        const postId = "post-id";
        likesReturn = [];
        qb.getMany = mock(() => Promise.resolve(likesReturn));

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
        const profile1Data = zocker(profileDto).generate();
        const profile2Data = zocker(profileDto).generate();
        const profile3Data = zocker(profileDto).generate();
        
        const like1 = {
            id: "like-1",
            profile: { ...profile1Data, createdAt: new Date(), updatedAt: new Date() },
            createdAt: new Date("2024-01-01T10:00:00Z"),
            interactionType: InteractionType.Like
        } as PostInteraction;
        
        const like2 = {
            id: "like-2",
            profile: { ...profile2Data, createdAt: new Date(), updatedAt: new Date() },
            createdAt: new Date("2024-01-02T15:30:00Z"),
            interactionType: InteractionType.Like
        } as PostInteraction;
        
        const like3 = {
            id: "like-3",
            profile: { ...profile3Data, createdAt: new Date(), updatedAt: new Date() },
            createdAt: new Date("2024-01-03T20:15:00Z"),
            interactionType: InteractionType.Like
        } as PostInteraction;

        // Return limit + 1 items to indicate next page exists
        likesReturn = [like1, like2, like3];
        qb.getMany = mock(() => Promise.resolve(likesReturn));

        // Act
        const result = await handler.handle({ postId, limit });

        // Assert
        expect(result.items.length).toBe(2); // Should return only limit items
        expect(result.hasNextPage).toBe(true);
        expect(result.count).toBe(2);
        expect(result.nextCursor).toBe(like2.id); // Cursor should be the last item returned
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
        const limit = 100; // Above MAX_LIMIT (50)

        // Act
        await handler.handle({ postId, limit });

        // Assert
        expect(qb.take).toHaveBeenCalledWith(51); // MAX_LIMIT (50) + 1
    });
});