import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Repository } from "typeorm";
import { RepostPostHandler } from "../repost-post.handler";
import { InteractionType, PostInteraction } from "@/database/entities/post-interaction";
import { Post } from "@/database/entities/post";
import { User } from "@/database/entities/user";
import { Profile } from "@/database/entities/profile";
import { NotFoundError, BlockedError } from "@/app/errors";
import { InteractionValidator } from "@/app/validators/interaction.validator";

describe("RepostPostHandler", () => {
    let handler: RepostPostHandler;
    let mockPostInteractionRepository: Repository<PostInteraction>;
    let mockPostRepository: Repository<Post>;
    let mockInteractionValidator: InteractionValidator;

    beforeEach(() => {
        mockPostInteractionRepository = {
            findOne: mock(() => Promise.resolve(null)),
            create: mock(data => data),
            save: mock(data => Promise.resolve({ ...data, id: "repost-id", createdAt: new Date(), updatedAt: new Date() }))
        } as any;

        mockPostRepository = {
            findOne: mock(() => Promise.resolve(null))
        } as any;

        mockInteractionValidator = {
            assertProfilesDoesNotBlockEachOther: mock(() => Promise.resolve())
        } as any;

        handler = new RepostPostHandler(mockPostInteractionRepository, mockPostRepository, mockInteractionValidator);
    });

    it("should repost post successfully when post exists and no blocks", async () => {
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

        const createdRepost = {
            id: "repost-id",
            user,
            profile,
            post: mockPost,
            interactionType: InteractionType.Repost,
            createdAt: new Date(),
            updatedAt: new Date()
        } as PostInteraction;

        mockPostRepository.findOne = mock(() => Promise.resolve(mockPost));
        mockPostInteractionRepository.findOne = mock(() => Promise.resolve(null));
        mockPostInteractionRepository.save = mock(() => Promise.resolve(createdRepost)) as any;

        // Act
        const result = await handler.handle(postId, user, profile);

        // Assert
        expect(result.message).toBe("Post reposted successfully");
        expect(result.repostedAt).toBeDefined();
        expect(mockPostRepository.findOne).toHaveBeenCalledWith({
            where: { id: postId },
            relations: ['profile']
        });
        expect(mockPostInteractionRepository.save).toHaveBeenCalled();
        expect(mockPostInteractionRepository.create).toHaveBeenCalledWith({
            user, profile, post: mockPost, interactionType: InteractionType.Repost
        });
    });

    it("should throw NotFoundError when post does not exist", async () => {
        // Arrange
        const postId = "non-existent-post";
        const user = { id: "b316b948-8f6c-4284-8b38-a68ca4d3dee0" } as User;
        const profile = { id: "14ae85e0-ec24-4c44-bfc7-1d0ba895f51d" } as Profile;

        mockPostRepository.findOne = mock(() => Promise.resolve(null));

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

        mockPostRepository.findOne = mock(() => Promise.resolve(mockPost));
        mockInteractionValidator.assertProfilesDoesNotBlockEachOther = mock(() => {
            throw new BlockedError("You cannot interact with a profile you have blocked");
        });

        // Act & Assert
        expect(handler.handle(postId, user, profile))
            .rejects.toThrow(BlockedError);
        expect(mockPostInteractionRepository.save).not.toHaveBeenCalled();
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

        mockPostRepository.findOne = mock(() => Promise.resolve(mockPost));
        mockInteractionValidator.assertProfilesDoesNotBlockEachOther = mock(() => {
            throw new BlockedError("You cannot interact with a profile that has blocked you");
        });

        // Act & Assert
        expect(handler.handle(postId, user, profile))
            .rejects.toThrow(BlockedError);
        expect(mockPostInteractionRepository.save).not.toHaveBeenCalled();
    });

    it("should return existing repost when post is already reposted", async () => {
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

        const existingRepost = {
            id: "repost-id",
            user,
            profile,
            post: mockPost,
            interactionType: InteractionType.Repost,
            createdAt: new Date("2024-01-01"),
            updatedAt: new Date("2024-01-01")
        } as PostInteraction;

        mockPostRepository.findOne = mock(() => Promise.resolve(mockPost));
        mockPostInteractionRepository.findOne = mock(() => Promise.resolve(existingRepost));

        // Act
        const result = await handler.handle(postId, user, profile);

        // Assert
        expect(result.message).toBe("Post is already reposted");
        expect(result.repostedAt).toEqual(existingRepost.createdAt);
        expect(mockPostInteractionRepository.save).not.toHaveBeenCalled();
    });
});

