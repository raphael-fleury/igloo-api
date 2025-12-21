import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Repository } from "typeorm";
import { DeletePostHandler } from "../delete-post.handler";
import { Post } from "@/database/entities/post";
import { NotFoundError, UnauthorizedError } from "@/app/errors";

describe("DeletePostHandler", () => {
    let handler: DeletePostHandler;
    let mockPostRepository: Repository<Post>;

    beforeEach(() => {
        mockPostRepository = {
            findOneBy: mock(() => Promise.resolve(null)),
            remove: mock((data) => Promise.resolve(data))
        } as any;

        handler = new DeletePostHandler(mockPostRepository);
    });

    it("should delete post successfully when post exists and profile matches", async () => {
        // Arrange
        const postId = "99e85e01-ec24-4c44-bfc7-1d0ba895f51e";
        const profileId = "14ae85e0-ec24-4c44-bfc7-1d0ba895f51d";
        const mockPost = {
            id: postId,
            profile: { id: profileId },
            content: "Test post",
            createdAt: new Date(),
            updatedAt: new Date()
        } as Post;

        mockPostRepository.findOneBy = mock(() => Promise.resolve(mockPost));

        // Act
        const result = await handler.handle(postId, profileId);

        // Assert
        expect(result.message).toBe("Post deleted successfully");
        expect(mockPostRepository.findOneBy).toHaveBeenCalledWith({ id: postId });
        expect(mockPostRepository.remove).toHaveBeenCalledWith(mockPost);
    });

    it("should throw NotFoundError when post does not exist", async () => {
        // Arrange
        const postId = "non-existent-post";
        const profileId = "14ae85e0-ec24-4c44-bfc7-1d0ba895f51d";

        // Act & Assert
        expect(async () => {
            await handler.handle(postId, profileId);
        }).toThrow(NotFoundError);
    });

    it("should throw UnauthorizedError when profile does not match post author", async () => {
        // Arrange
        const postId = "99e85e01-ec24-4c44-bfc7-1d0ba895f51e";
        const authorProfileId = "14ae85e0-ec24-4c44-bfc7-1d0ba895f51d";
        const otherProfileId = "24ae85e0-ec24-4c44-bfc7-1d0ba895f51e";
        
        const mockPost = {
            id: postId,
            profile: { id: authorProfileId },
            content: "Test post",
            createdAt: new Date(),
            updatedAt: new Date()
        } as Post;

        mockPostRepository.findOneBy = mock(() => Promise.resolve(mockPost));

        // Act & Assert
        expect(async () => {
            await handler.handle(postId, otherProfileId);
        }).toThrow(UnauthorizedError);
    });
});
