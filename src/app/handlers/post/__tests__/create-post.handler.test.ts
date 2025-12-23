import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Repository } from "typeorm";
import { CreatePostHandler } from "../create-post.handler";
import { BlockedError, NotFoundError } from "@/app/errors";
import { Post } from "@/database/entities/post";
import { User } from "@/database/entities/user";
import { Profile } from "@/database/entities/profile";
import { Block } from "@/database/entities/block";

describe("CreatePostHandler", () => {
    let handler: CreatePostHandler;
    let mockPostRepository: Repository<Post>;
    let mockBlockRepository: Repository<Block>;

    beforeEach(() => {
        mockPostRepository = {
            findOneBy: mock(() => Promise.resolve(null)),
            create: mock((data) => data),
            save: mock((data) => Promise.resolve({ ...data, id: "post-id", createdAt: new Date(), updatedAt: new Date() }))
        } as any;

        mockBlockRepository = {
            findOne: mock(() => Promise.resolve(null))
        } as any;

        handler = new CreatePostHandler(mockPostRepository, mockBlockRepository);
    });

    it("should create post successfully when user and profile exist", async () => {
        // Arrange
        const user = { id: "b316b948-8f6c-4284-8b38-a68ca4d3dee0" } as User;
        const profile = { id: "14ae85e0-ec24-4c44-bfc7-1d0ba895f51d" } as Profile;
        const postId = "99e85e01-ec24-4c44-bfc7-1d0ba895f51e";

        mockPostRepository.save = mock((data) => Promise.resolve({
            id: postId,
            user,
            profile,
            content: "This is a test post",
            replyToPost: null,
            createdAt: new Date(),
            updatedAt: new Date()
        } as any));

        const createPostData = {
            userId: user.id,
            profileId: profile.id,
            content: "This is a test post"
        };

        // Act
        const result = await handler.handle(createPostData, user, profile);

        // Assert
        expect(result.content).toBe("This is a test post");
        expect(mockPostRepository.create).toHaveBeenCalledWith({
            user: { id: user.id },
            profile: { id: profile.id },
            content: "This is a test post",
            replyToPost: undefined,
            quoteToPost: undefined
        });
        expect(mockPostRepository.save).toHaveBeenCalled();
    });

    it("should throw NotFoundError when replied post does not exist", async () => {
        // Arrange
        const userId = "b316b948-8f6c-4284-8b38-a68ca4d3dee0";
        const profileId = "14ae85e0-ec24-4c44-bfc7-1d0ba895f51d";

        const createPostData = {
            userId,
            profileId,
            content: "This is a reply",
            replyToPostId: "non-existent-post"
        };

        // Act & Assert
        expect(async () => {
            await handler.handle(createPostData, { id: userId } as User, { id: profileId } as Profile);
        }).toThrow(NotFoundError);
    });

    it("should throw BlockedError when user has blocked the author of the replied post", async () => {
        // Arrange
        const userId = "b316b948-8f6c-4284-8b38-a68ca4d3dee0";
        const profileId = "14ae85e0-ec24-4c44-bfc7-1d0ba895f51d";
        const repliedPostAuthorProfileId = "profile-of-replied-post-author";

        const createPostData = {
            userId,
            profileId,
            content: "This is a reply",
            replyToPostId: "replied-post-id"
        };

        mockPostRepository.findOneBy = mock(() => Promise.resolve({
            id: "replied-post-id",
            profile: { id: repliedPostAuthorProfileId }
        } as any));

        mockBlockRepository.findOne = mock(() => Promise.resolve({
            id: "block-id",
            blockerProfile: { id: profileId },
            blockedProfile: { id: repliedPostAuthorProfileId }
        } as any));

        // Act & Assert
        expect(async () => {
            await handler.handle(createPostData, { id: userId } as User, { id: profileId } as Profile);
        }).toThrowError(BlockedError);
    });

    it("should throw BlockedError when author of the replied post has blocked the user", async () => {
        // Arrange
        const userId = "b316b948-8f6c-4284-8b38-a68ca4d3dee0";
        const profileId = "14ae85e0-ec24-4c44-bfc7-1d0ba895f51d";
        const repliedPostAuthorProfileId = "profile-of-replied-post-author";
        const createPostData = {
            userId,
            profileId,
            content: "This is a reply",
            replyToPostId: "replied-post-id"
        };
        mockPostRepository.findOneBy = mock(() => Promise.resolve({
            id: "replied-post-id",
            profile: { id: repliedPostAuthorProfileId }
        } as any));

        mockBlockRepository.findOne = mock(() => Promise.resolve({
            id: "block-id",
            blockerProfile: { id: repliedPostAuthorProfileId },
            blockedProfile: { id: profileId }
        } as any));

        // Act & Assert
        expect(async () => {
            await handler.handle(createPostData, { id: userId } as User, { id: profileId } as Profile);
        }).toThrowError(BlockedError);
    });

    it("should throw NotFoundError when quoted post does not exist", async () => {
        // Arrange
        const userId = "b316b948-8f6c-4284-8b38-a68ca4d3dee0";
        const profileId = "14ae85e0-ec24-4c44-bfc7-1d0ba895f51d";

        const createPostData = {
            userId,
            profileId,
            content: "This is a quote",
            quoteToPostId: "non-existent-post"
        };

        // Act & Assert
        expect(async () => {
            await handler.handle(createPostData, { id: userId } as User, { id: profileId } as Profile);
        }).toThrow(NotFoundError);
    });

    it("should throw BlockedError when user has blocked the author of the quoted post", async () => {
        // Arrange
        const userId = "b316b948-8f6c-4284-8b38-a68ca4d3dee0";
        const profileId = "14ae85e0-ec24-4c44-bfc7-1d0ba895f51d";
        const quotedPostAuthorProfileId = "profile-of-quoted-post-author";

        const createPostData = {
            userId,
            profileId,
            content: "This is a quote",
            quoteToPostId: "quoted-post-id"
        };

        mockPostRepository.findOneBy = mock(() => Promise.resolve({
            id: "quoted-post-id",
            profile: { id: quotedPostAuthorProfileId }
        } as any));

        mockBlockRepository.findOne = mock(() => Promise.resolve({
            id: "block-id",
            blockerProfile: { id: profileId },
            blockedProfile: { id: quotedPostAuthorProfileId }
        } as any));

        // Act & Assert
        expect(async () => {
            await handler.handle(createPostData, { id: userId } as User, { id: profileId } as Profile);
        }).toThrowError(BlockedError);
    });

    it("should throw BlockedError when author of the quoted post has blocked the user", async () => {
        // Arrange
        const userId = "b316b948-8f6c-4284-8b38-a68ca4d3dee0";
        const profileId = "14ae85e0-ec24-4c44-bfc7-1d0ba895f51d";
        const quotedPostAuthorProfileId = "profile-of-quoted-post-author";
        const createPostData = {
            userId,
            profileId,
            content: "This is a quote",
            quoteToPostId: "quoted-post-id"
        };
        mockPostRepository.findOneBy = mock(() => Promise.resolve({
            id: "quoted-post-id",
            profile: { id: quotedPostAuthorProfileId }
        } as any));

        mockBlockRepository.findOne = mock(() => Promise.resolve({
            id: "block-id",
            blockerProfile: { id: quotedPostAuthorProfileId },
            blockedProfile: { id: profileId }
        } as any));

        // Act & Assert
        expect(async () => {
            await handler.handle(createPostData, { id: userId } as User, { id: profileId } as Profile);
        }).toThrowError(BlockedError);
    });

    it("should create post with quote successfully when quoted post exists and no blocks", async () => {
        // Arrange
        const user = { id: "b316b948-8f6c-4284-8b38-a68ca4d3dee0" } as User;
        const profile = { id: "14ae85e0-ec24-4c44-bfc7-1d0ba895f51d" } as Profile;
        const quotedPostAuthorProfile = { id: "quoted-post-author-profile-id" } as Profile;
        const quotedPost = {
            id: "quoted-post-id",
            profile: quotedPostAuthorProfile,
            content: "Original post",
            createdAt: new Date(),
            updatedAt: new Date()
        } as Post;

        mockPostRepository.findOneBy = mock(() => Promise.resolve(quotedPost));
        mockBlockRepository.findOne = mock(() => Promise.resolve(null));
        mockPostRepository.save = mock((data) => Promise.resolve({
            id: "post-id",
            user,
            profile,
            content: "This is a quote",
            quoteToPost: quotedPost,
            createdAt: new Date(),
            updatedAt: new Date()
        } as any));

        const createPostData = {
            content: "This is a quote",
            quoteToPostId: "quoted-post-id"
        };

        // Act
        const result = await handler.handle(createPostData, user, profile);

        // Assert
        expect(result.content).toBe("This is a quote");
        expect(result.quoteToPostId).toBe("quoted-post-id");
        expect(mockPostRepository.create).toHaveBeenCalledWith({
            user,
            profile,
            content: "This is a quote",
            replyToPost: undefined,
            quoteToPost: quotedPost
        });
        expect(mockPostRepository.save).toHaveBeenCalled();
    });
});
