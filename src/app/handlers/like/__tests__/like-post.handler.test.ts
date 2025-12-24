import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Repository } from "typeorm";
import { zocker } from "zocker";
import { LikePostHandler } from "../like-post.handler";
import { userDto } from "@/app/dtos/user.dtos";
import { profileDto } from "@/app/dtos/profile.dtos";
import { idDto } from "@/app/dtos/common.dtos";
import { postDto } from "@/app/dtos/post.dtos";
import { NotFoundError, BlockedError } from "@/app/errors";
import { InteractionValidator } from "@/app/validators/interaction.validator";
import { InteractionType, PostInteraction } from "@/database/entities/post-interaction";
import { Post } from "@/database/entities/post";
import { User } from "@/database/entities/user";
import { Profile } from "@/database/entities/profile";

describe("LikePostHandler", () => {
    let handler: LikePostHandler;
    let mockPostInteractionRepository: Repository<PostInteraction>;
    let mockPostRepository: Repository<Post>;
    let mockInteractionValidator: InteractionValidator;

    beforeEach(() => {
        mockPostInteractionRepository = {
            findOne: mock(() => Promise.resolve(null)),
            create: mock(data => data),
            save: mock(data => Promise.resolve({ ...data, id: "like-id", createdAt: new Date(), updatedAt: new Date() }))
        } as any;

        mockPostRepository = {
            findOne: mock(() => Promise.resolve(null))
        } as any;

        mockInteractionValidator = {
            assertProfilesDoesNotBlockEachOther: mock(() => Promise.resolve())
        } as any;

        handler = new LikePostHandler(mockPostInteractionRepository, mockPostRepository, mockInteractionValidator);
    });

    it("should like post successfully when post exists and no blocks", async () => {
        // Arrange
        const postData = zocker(postDto).generate();
        const postId = postData.id;
        const user = zocker(userDto).generate() as User;
        const profile = zocker(profileDto).generate() as Profile;
        const postAuthorProfile = { id: postData.profileId } as Profile;
        const mockPost = {
            id: postId,
            profile: postAuthorProfile,
            content: postData.content,
            createdAt: postData.createdAt,
            updatedAt: postData.updatedAt
        } as Post;

        const createdLike = {
            id: "like-id",
            user,
            profile,
            post: mockPost,
            interactionType: InteractionType.Like,
            createdAt: new Date(),
            updatedAt: new Date()
        } as PostInteraction;

        mockPostRepository.findOne = mock(() => Promise.resolve(mockPost));
        mockPostInteractionRepository.findOne = mock(() => Promise.resolve(null));
        mockPostInteractionRepository.save = mock(() => Promise.resolve(createdLike)) as any;

        // Act
        const result = await handler.handle(postId, user, profile);

        // Assert
        expect(result.message).toBe("Post liked successfully");
        expect(result.likedAt).toBeDefined();
        expect(mockPostRepository.findOne).toHaveBeenCalledWith({
            where: { id: postId },
            relations: ['profile']
        });
        expect(mockPostInteractionRepository.save).toHaveBeenCalled();
        expect(mockPostInteractionRepository.create).toHaveBeenCalledWith({
            user, profile, post: mockPost, interactionType: InteractionType.Like
        });
    });

    it("should throw NotFoundError when post does not exist", async () => {
        // Arrange
        const postId = zocker(idDto).generate();
        const user = zocker(userDto).generate() as User;
        const profile = zocker(profileDto).generate() as Profile;

        mockPostRepository.findOne = mock(() => Promise.resolve(null));

        // Act & Assert
        expect(handler.handle(postId, user, profile))
            .rejects.toThrow(NotFoundError);
        expect(handler.handle(postId, user, profile))
            .rejects.toThrow(`Post with id ${postId} not found`);
    });

    it("should throw BlockedError when user has blocked the author of the post", async () => {
        // Arrange
        const postData = zocker(postDto).generate();
        const postId = postData.id;
        const user = zocker(userDto).generate() as User;
        const profile = zocker(profileDto).generate() as Profile;
        const postAuthorProfile = { id: postData.profileId } as Profile;
        const mockPost = {
            id: postId,
            profile: postAuthorProfile,
            content: postData.content,
            createdAt: postData.createdAt,
            updatedAt: postData.updatedAt
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
        const postData = zocker(postDto).generate();
        const postId = postData.id;
        const user = zocker(userDto).generate() as User;
        const profile = zocker(profileDto).generate() as Profile;
        const postAuthorProfile = { id: postData.profileId } as Profile;
        const mockPost = {
            id: postId,
            profile: postAuthorProfile,
            content: postData.content,
            createdAt: postData.createdAt,
            updatedAt: postData.updatedAt
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

    it("should return existing like when post is already liked", async () => {
        // Arrange
        const postData = zocker(postDto).generate();
        const postId = postData.id;
        const user = zocker(userDto).generate() as User;
        const profile = zocker(profileDto).generate() as Profile;
        const postAuthorProfile = { id: postData.profileId } as Profile;
        const mockPost = {
            id: postId,
            profile: postAuthorProfile,
            content: postData.content,
            createdAt: postData.createdAt,
            updatedAt: postData.updatedAt
        } as Post;

        const existingLike = {
            id: "like-id",
            user,
            profile,
            post: mockPost,
            interactionType: InteractionType.Like,
            createdAt: new Date("2024-01-01"),
            updatedAt: new Date("2024-01-01")
        } as PostInteraction;

        mockPostRepository.findOne = mock(() => Promise.resolve(mockPost));
        mockPostInteractionRepository.findOne = mock(() => Promise.resolve(existingLike));

        // Act
        const result = await handler.handle(postId, user, profile);

        // Assert
        expect(result.message).toBe("Post is already liked");
        expect(result.likedAt).toEqual(existingLike.createdAt);
        expect(mockPostInteractionRepository.save).not.toHaveBeenCalled();
    });
});

