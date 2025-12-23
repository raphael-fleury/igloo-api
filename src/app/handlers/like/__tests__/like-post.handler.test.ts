import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Repository } from "typeorm";
import { LikePostHandler } from "../like-post.handler";
import { Like } from "@/database/entities/like";
import { Post } from "@/database/entities/post";
import { Block } from "@/database/entities/block";
import { User } from "@/database/entities/user";
import { Profile } from "@/database/entities/profile";
import { NotFoundError, BlockedError } from "@/app/errors";

describe("LikePostHandler", () => {
    let handler: LikePostHandler;
    let mockLikeRepository: Repository<Like>;
    let mockPostRepository: Repository<Post>;
    let mockBlockRepository: Repository<Block>;

    beforeEach(() => {
        mockLikeRepository = {
            findOne: mock(() => Promise.resolve(null)),
            create: mock(data => data),
            save: mock(data => Promise.resolve({ ...data, id: "like-id", createdAt: new Date(), updatedAt: new Date() }))
        } as any;

        mockPostRepository = {
            findOne: mock(() => Promise.resolve(null))
        } as any;

        mockBlockRepository = {
            findOne: mock(() => Promise.resolve(null))
        } as any;

        handler = new LikePostHandler(mockLikeRepository, mockPostRepository, mockBlockRepository);
    });

    it("should like post successfully when post exists and no blocks", async () => {
        // Arrange
        const postId = "99e85e01-ec24-4c44-bfc7-1d0ba895f51e";
        const user = { id: "b316b948-8f6c-4284-8b38-a68ca4d3dee0" } as User;
        const profile = { id: "14ae85e0-ec24-4c44-bfc7-1d0ba895f51d" } as Profile;
        const postAuthorProfile = { id: "author-profile-id" } as Profile;

        const mockPost = {
            id: postId,
            profile: postAuthorProfile,
            content: "Test post",
            createdAt: new Date(),
            updatedAt: new Date()
        } as Post;

        const createdLike = {
            id: "like-id",
            user,
            profile,
            post: mockPost,
            createdAt: new Date(),
            updatedAt: new Date()
        } as Like;

        mockPostRepository.findOne = mock(() => Promise.resolve(mockPost));
        mockBlockRepository.findOne = mock(() => Promise.resolve(null));
        mockLikeRepository.findOne = mock(() => Promise.resolve(null));
        mockLikeRepository.save = mock(() => Promise.resolve(createdLike)) as any;

        // Act
        const result = await handler.handle(postId, user, profile);

        // Assert
        expect(result.message).toBe("Post liked successfully");
        expect(result.likedAt).toBeDefined();
        expect(mockPostRepository.findOne).toHaveBeenCalledWith({
            where: { id: postId },
            relations: ['profile']
        });
        expect(mockLikeRepository.save).toHaveBeenCalled();
        expect(mockLikeRepository.create).toHaveBeenCalledWith({ user, profile, post: mockPost });
    });

    it("should throw NotFoundError when post does not exist", async () => {
        // Arrange
        const postId = "non-existent-post";
        const user = { id: "b316b948-8f6c-4284-8b38-a68ca4d3dee0" } as User;
        const profile = { id: "14ae85e0-ec24-4c44-bfc7-1d0ba895f51d" } as Profile;

        mockPostRepository.findOneBy = mock(() => Promise.resolve(null));

        // Act & Assert
        expect(handler.handle(postId, user, profile))
            .rejects.toThrow(NotFoundError);
        expect(handler.handle(postId, user, profile))
            .rejects.toThrow(`Post with id ${postId} not found`);
    });

    it("should throw BlockedError when user has blocked the author of the post", async () => {
        // Arrange
        const postId = "99e85e01-ec24-4c44-bfc7-1d0ba895f51e";
        const user = { id: "b316b948-8f6c-4284-8b38-a68ca4d3dee0" } as User;
        const profile = { id: "14ae85e0-ec24-4c44-bfc7-1d0ba895f51d" } as Profile;
        const postAuthorProfile = { id: "author-profile-id" } as Profile;

        const mockPost = {
            id: postId,
            profile: postAuthorProfile,
            content: "Test post",
            createdAt: new Date(),
            updatedAt: new Date()
        } as Post;

        const blockRecord = {
            id: "block-id",
            blockerProfile: profile,
            blockedProfile: postAuthorProfile,
            createdAt: new Date(),
            updatedAt: new Date()
        } as Block;

        mockPostRepository.findOne = mock(() => Promise.resolve(mockPost));
        mockBlockRepository.findOne = mock(() => Promise.resolve(blockRecord));

        // Act & Assert
        expect(handler.handle(postId, user, profile))
            .rejects.toThrow(BlockedError);
        expect(mockLikeRepository.save).not.toHaveBeenCalled();
    });

    it("should throw BlockedError when author of the post has blocked the user", async () => {
        // Arrange
        const postId = "99e85e01-ec24-4c44-bfc7-1d0ba895f51e";
        const user = { id: "b316b948-8f6c-4284-8b38-a68ca4d3dee0" } as User;
        const profile = { id: "14ae85e0-ec24-4c44-bfc7-1d0ba895f51d" } as Profile;
        const postAuthorProfile = { id: "author-profile-id" } as Profile;

        const mockPost = {
            id: postId,
            profile: postAuthorProfile,
            content: "Test post",
            createdAt: new Date(),
            updatedAt: new Date()
        } as Post;

        const blockRecord = {
            id: "block-id",
            blockerProfile: postAuthorProfile,
            blockedProfile: profile,
            createdAt: new Date(),
            updatedAt: new Date()
        } as Block;

        mockPostRepository.findOne = mock(() => Promise.resolve(mockPost));
        mockBlockRepository.findOne = mock()
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(blockRecord);

        // Act & Assert
        expect(handler.handle(postId, user, profile))
            .rejects.toThrow(BlockedError);
        expect(mockLikeRepository.save).not.toHaveBeenCalled();
    });

    it("should return existing like when post is already liked", async () => {
        // Arrange
        const postId = "99e85e01-ec24-4c44-bfc7-1d0ba895f51e";
        const user = { id: "b316b948-8f6c-4284-8b38-a68ca4d3dee0" } as User;
        const profile = { id: "14ae85e0-ec24-4c44-bfc7-1d0ba895f51d" } as Profile;
        const postAuthorProfile = { id: "author-profile-id" } as Profile;

        const mockPost = {
            id: postId,
            profile: postAuthorProfile,
            content: "Test post",
            createdAt: new Date(),
            updatedAt: new Date()
        } as Post;

        const existingLike = {
            id: "like-id",
            user,
            profile,
            post: mockPost,
            createdAt: new Date("2024-01-01"),
            updatedAt: new Date("2024-01-01")
        } as Like;

        mockPostRepository.findOne = mock(() => Promise.resolve(mockPost));
        mockBlockRepository.findOne = mock(() => Promise.resolve(null));
        mockLikeRepository.findOne = mock(() => Promise.resolve(existingLike));

        // Act
        const result = await handler.handle(postId, user, profile);

        // Assert
        expect(result.message).toBe("Post is already liked");
        expect(result.likedAt).toEqual(existingLike.createdAt);
        expect(mockLikeRepository.save).not.toHaveBeenCalled();
    });
});

