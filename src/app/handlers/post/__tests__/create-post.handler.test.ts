import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Repository } from "typeorm";
import { CreatePostHandler } from "../create-post.handler";
import { BlockedError, NotFoundError } from "@/app/errors";
import { Post } from "@/database/entities/post";
import { User } from "@/database/entities/user";
import { Profile } from "@/database/entities/profile";
import { InteractionValidator } from "@/app/validators/interaction.validator";

describe("CreatePostHandler", () => {
    let handler: CreatePostHandler;
    let mockPostRepository: Repository<Post>;
    let mockInteractionValidator: InteractionValidator;

    beforeEach(() => {
        mockPostRepository = {
            findOneBy: mock(() => Promise.resolve(null)),
            create: mock((data) => data),
            save: mock((data) => Promise.resolve({ ...data, id: "post-id", createdAt: new Date(), updatedAt: new Date() }))
        } as any;

        mockInteractionValidator = {
            assertProfilesDoesNotBlockEachOther: mock(() => Promise.resolve())
        } as any;

        handler = new CreatePostHandler(mockPostRepository, mockInteractionValidator);
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
            replyToPostId: "123e4567-e89b-12d3-a456-426614174000"
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
        const repliedPostId = "123e4567-e89b-12d3-a456-426614174000";

        const createPostData = {
            userId,
            profileId,
            content: "This is a reply",
            replyToPostId: repliedPostId
        };

        mockPostRepository.findOneBy = mock(() => Promise.resolve({
            id: repliedPostId,
            profile: { id: repliedPostAuthorProfileId }
        } as any));

        mockInteractionValidator.assertProfilesDoesNotBlockEachOther = mock(() => {
            throw new BlockedError("You cannot interact with a profile you have blocked");
        });

        // Act & Assert
        expect(handler.handle(createPostData, { id: userId } as User, { id: profileId } as Profile))
            .rejects.toThrow(BlockedError);
    });

    it("should throw BlockedError when author of the replied post has blocked the user", async () => {
        // Arrange
        const userId = "b316b948-8f6c-4284-8b38-a68ca4d3dee0";
        const profileId = "14ae85e0-ec24-4c44-bfc7-1d0ba895f51d";
        const repliedPostAuthorProfileId = "profile-of-replied-post-author";
        const repliedPostId = "123e4567-e89b-12d3-a456-426614174000";

        const createPostData = {
            userId,
            profileId,
            content: "This is a reply",
            replyToPostId: repliedPostId
        };
        mockPostRepository.findOneBy = mock(() => Promise.resolve({
            id: repliedPostId,
            profile: { id: repliedPostAuthorProfileId }
        } as any));

        mockInteractionValidator.assertProfilesDoesNotBlockEachOther = mock(() => {
            throw new BlockedError("You cannot interact with a profile that has blocked you");
        });

        // Act & Assert
        expect(handler.handle(createPostData, { id: userId } as User, { id: profileId } as Profile))
            .rejects.toThrow(BlockedError);
    });

    it("should throw NotFoundError when quoted post does not exist", async () => {
        // Arrange
        const userId = "b316b948-8f6c-4284-8b38-a68ca4d3dee0";
        const profileId = "14ae85e0-ec24-4c44-bfc7-1d0ba895f51d";

        const createPostData = {
            userId,
            profileId,
            content: "This is a quote",
            quoteToPostId: "123e4567-e89b-12d3-a456-426614174000"
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
        const quotedPostId = "123e4567-e89b-12d3-a456-426614174000";

        const createPostData = {
            userId,
            profileId,
            content: "This is a quote",
            quoteToPostId: quotedPostId
        };

        mockPostRepository.findOneBy = mock(() => Promise.resolve({
            id: quotedPostId,
            profile: { id: quotedPostAuthorProfileId }
        } as any));

        mockInteractionValidator.assertProfilesDoesNotBlockEachOther = mock(() => {
            throw new BlockedError("You cannot interact with a profile you have blocked");
        });

        // Act & Assert
        expect(handler.handle(createPostData, { id: userId } as User, { id: profileId } as Profile))
            .rejects.toThrow(BlockedError);
    });

    it("should throw BlockedError when author of the quoted post has blocked the user", async () => {
        // Arrange
        const userId = "b316b948-8f6c-4284-8b38-a68ca4d3dee0";
        const profileId = "14ae85e0-ec24-4c44-bfc7-1d0ba895f51d";
        const quotedPostAuthorProfileId = "profile-of-quoted-post-author";
        const quotedPostId = "123e4567-e89b-12d3-a456-426614174000";
        const createPostData = {
            userId,
            profileId,
            content: "This is a quote",
            quoteToPostId: quotedPostId
        };
        mockPostRepository.findOneBy = mock(() => Promise.resolve({
            id: quotedPostId,
            profile: { id: quotedPostAuthorProfileId }
        } as any));

        mockInteractionValidator.assertProfilesDoesNotBlockEachOther = mock(() => {
            throw new BlockedError("You cannot interact with a profile that has blocked you");
        });

        // Act & Assert
        expect(handler.handle(createPostData, { id: userId } as User, { id: profileId } as Profile))
            .rejects.toThrow(BlockedError);
    });

    it("should create post with quote successfully when quoted post exists and no blocks", async () => {
        // Arrange
        const user = { id: "b316b948-8f6c-4284-8b38-a68ca4d3dee0" } as User;
        const profile = { id: "14ae85e0-ec24-4c44-bfc7-1d0ba895f51d" } as Profile;
        const quotedPostAuthorProfile = { id: "quoted-post-author-profile-id" } as Profile;
        const quotedPostId = "123e4567-e89b-12d3-a456-426614174000";
        const newPostId = "99e85e01-ec24-4c44-bfc7-1d0ba895f51e";

        const quotedPost = {
            id: quotedPostId,
            profile: quotedPostAuthorProfile,
            content: "Original post",
            createdAt: new Date(),
            updatedAt: new Date()
        } as Post;

        mockPostRepository.findOneBy = mock(() => Promise.resolve(quotedPost));
        mockPostRepository.save = mock((data) => Promise.resolve({
            id: newPostId,
            user,
            profile,
            content: "This is a quote",
            quoteToPost: quotedPost,
            createdAt: new Date(),
            updatedAt: new Date()
        } as any));

        const createPostData = {
            content: "This is a quote",
            quoteToPostId: quotedPostId
        };

        // Act
        const result = await handler.handle(createPostData, user, profile);

        // Assert
        expect(result.content).toBe("This is a quote");
        expect(result.quoteToPostId).toBe(quotedPostId);
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
