import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Repository } from "typeorm";
import { GetPostByIdHandler } from "../get-post-by-id.handler";
import { Post } from "@/database/entities/post";
import { NotFoundError } from "@/app/errors";

describe("GetPostByIdHandler", () => {
    let handler: GetPostByIdHandler;
    let mockPostRepository: Repository<Post>;

    beforeEach(() => {
        mockPostRepository = {
            findOne: mock(() => Promise.resolve(null))
        } as any;

        handler = new GetPostByIdHandler(mockPostRepository);
    });

    it("should return post when post exists", async () => {
        // Arrange
        const postId = "99e85e01-ec24-4c44-bfc7-1d0ba895f51e";
        const userId = "b316b948-8f6c-4284-8b38-a68ca4d3dee0";
        const profileId = "14ae85e0-ec24-4c44-bfc7-1d0ba895f51d";
        const mockPost = {
            id: postId,
            user: { id: userId },
            profile: { id: profileId },
            content: "Test post",
            replyToPost: null,
            quoteToPost: null,
            createdAt: new Date(),
            updatedAt: new Date()
        } as any;

        mockPostRepository.findOne = mock(() => Promise.resolve(mockPost));

        // Act
        const result = await handler.handle(postId);

        // Assert
        expect(result.id).toBe(postId);
        expect(result.content).toBe("Test post");
        expect(mockPostRepository.findOne).toHaveBeenCalledWith({
            where: { id: postId },
            relations: ['quoteToPost']
        });
    });

    it("should throw NotFoundError when post does not exist", async () => {
        // Arrange
        const postId = "non-existent-post";

        // Act & Assert
        expect(async () => {
            await handler.handle(postId);
        }).toThrow(NotFoundError);
    });
});
