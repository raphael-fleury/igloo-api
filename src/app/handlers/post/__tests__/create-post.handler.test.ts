import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Repository } from "typeorm";
import { zocker } from "zocker";
import { CreatePostHandler } from "../create-post.handler";
import { BlockedError, NotFoundError } from "@/app/errors";
import { userDto } from "@/app/dtos/user.dtos";
import { profileDto } from "@/app/dtos/profile.dtos";
import { idDto } from "@/app/dtos/common.dtos";
import { InteractionValidator } from "@/app/validators/interaction.validator";
import { MentionService } from "@/app/services/mention.service";
import { Post } from "@/database/entities/post";

describe("CreatePostHandler", () => {
    let handler: CreatePostHandler;
    let mockPostRepository: Repository<Post>;
    let mockInteractionValidator: InteractionValidator;
    let mockMentionService: MentionService;

    beforeEach(() => {
        mockPostRepository = {
            findOneBy: mock(),
            create: mock(),
            save: mock()
        } as any;

        mockInteractionValidator = {
            assertProfilesDoesNotBlockEachOther: mock()
        } as any;

        mockMentionService = {
            createMentionsForPost: mock()
        } as any;

        handler = new CreatePostHandler(mockPostRepository, mockInteractionValidator, mockMentionService);
    });

    it("should create post successfully when user and profile exist", async () => {
        // Arrange
        const user = zocker(userDto).generate();
        const profile = zocker(profileDto).generate();
        const savedPostId = zocker(idDto).generate();

        const createPostData = {
            content: "This is a test post"
        };

        const savedPost = {
            id: savedPostId,
            user,
            profile,
            content: "This is a test post",
            repliedPost: null,
            createdAt: new Date(),
            updatedAt: new Date()
        } as any;

        mockPostRepository.create = mock(() => ({}));
        mockPostRepository.save = mock(() => Promise.resolve(savedPost));
        mockMentionService.createMentionsForPost = mock(() => Promise.resolve());

        // Act
        const result = await handler.handle({
            data: createPostData,
            user,
            profile
        });

        // Assert
        expect(result.content).toBe("This is a test post");
        expect(mockPostRepository.create).toHaveBeenCalledWith({
            user,
            profile,
            content: "This is a test post",
            repliedPost: undefined,
            quotedPost: undefined
        });
        expect(mockPostRepository.save).toHaveBeenCalled();
        expect(mockMentionService.createMentionsForPost).toHaveBeenCalledWith(
            savedPost,
            "This is a test post"
        );
    });

    it("should throw NotFoundError when replied post does not exist", async () => {
        // Arrange
        const user = zocker(userDto).generate();
        const profile = zocker(profileDto).generate();

        const createPostData = {
            content: "This is a reply",
            repliedPostId: zocker(idDto).generate()
        };

        // Act & Assert
        expect(async () => {
            await handler.handle({
                data: createPostData,
                user,
                profile
            });
        }).toThrow(NotFoundError);
    });

    it("should throw BlockedError when user has blocked the author of the replied post", async () => {
        // Arrange
        const user = zocker(userDto).generate();
        const profile = zocker(profileDto).generate();
        const repliedPostAuthorProfileId = zocker(idDto).generate();
        const repliedPostId = zocker(idDto).generate();

        const createPostData = {
            content: "This is a reply",
            repliedPostId: repliedPostId
        };

        mockPostRepository.findOneBy = mock(() => Promise.resolve({
            id: repliedPostId,
            profile: { id: repliedPostAuthorProfileId }
        } as any));

        mockInteractionValidator.assertProfilesDoesNotBlockEachOther = mock(() => {
            throw new BlockedError("You cannot interact with a profile you have blocked");
        });

        // Act & Assert
        expect(handler.handle({ data: createPostData, user, profile }))
            .rejects.toThrow(BlockedError);
    });

    it("should throw BlockedError when author of the replied post has blocked the user", async () => {
        // Arrange
        const user = zocker(userDto).generate();
        const profile = zocker(profileDto).generate();
        const repliedPostAuthorProfileId = zocker(idDto).generate();
        const repliedPostId = zocker(idDto).generate();

        const createPostData = {
            content: "This is a reply",
            repliedPostId: repliedPostId
        };
        mockPostRepository.findOneBy = mock(() => Promise.resolve({
            id: repliedPostId,
            profile: { id: repliedPostAuthorProfileId }
        } as any));

        mockInteractionValidator.assertProfilesDoesNotBlockEachOther = mock(() => {
            throw new BlockedError("You cannot interact with a profile that has blocked you");
        });

        // Act & Assert
        expect(handler.handle({ data: createPostData, user, profile }))
            .rejects.toThrow(BlockedError);
    });

    it("should throw NotFoundError when quoted post does not exist", async () => {
        // Arrange
        const user = zocker(userDto).generate();
        const profile = zocker(profileDto).generate();

        const createPostData = {
            content: "This is a quote",
            quotedPostId: "123e4567-e89b-12d3-a456-426614174000"
        };

        // Act & Assert
        expect(async () => {
            await handler.handle({
                data: createPostData,
                user,
                profile
            });
        }).toThrow(NotFoundError);
    });

    it("should throw BlockedError when user has blocked the author of the quoted post", async () => {
        // Arrange
        const user = zocker(userDto).generate();
        const profile = zocker(profileDto).generate();
        const quotedPostAuthorProfileId = zocker(idDto).generate();
        const quotedPostId = zocker(idDto).generate();

        const createPostData = {
            content: "This is a quote",
            quotedPostId: quotedPostId
        };

        mockPostRepository.findOneBy = mock(() => Promise.resolve({
            id: quotedPostId,
            profile: { id: quotedPostAuthorProfileId }
        } as any));

        mockInteractionValidator.assertProfilesDoesNotBlockEachOther = mock(() => {
            throw new BlockedError("You cannot interact with a profile you have blocked");
        });

        // Act & Assert
        expect(handler.handle({ data: createPostData, user, profile }))
            .rejects.toThrow(BlockedError);
    });

    it("should throw BlockedError when author of the quoted post has blocked the user", async () => {
        // Arrange
        const user = zocker(userDto).generate();
        const profile = zocker(profileDto).generate();
        const quotedPostAuthorProfileId = zocker(idDto).generate();
        const quotedPostId = zocker(idDto).generate();
        const createPostData = {
            content: "This is a quote",
            quotedPostId: quotedPostId
        };
        mockPostRepository.findOneBy = mock(() => Promise.resolve({
            id: quotedPostId,
            profile: { id: quotedPostAuthorProfileId }
        } as any));

        mockInteractionValidator.assertProfilesDoesNotBlockEachOther = mock(() => {
            throw new BlockedError("You cannot interact with a profile that has blocked you");
        });

        // Act & Assert
        expect(handler.handle({ data: createPostData, user, profile }))
            .rejects.toThrow(BlockedError);
    });

    it("should create post with quote successfully when quoted post exists and no blocks", async () => {
        // Arrange
        const user = zocker(userDto).generate();
        const profile = zocker(profileDto).generate();
        const quotedPostAuthorProfile = zocker(profileDto).generate();
        const quotedPostId = zocker(idDto).generate();
        const newPostId = zocker(idDto).generate();

        const quotedPost = {
            id: quotedPostId,
            profile: quotedPostAuthorProfile,
            content: "Original post",
            createdAt: new Date(),
            updatedAt: new Date()
        } as Post;

        const savedPost = {
            id: newPostId,
            user,
            profile,
            content: "This is a quote",
            quotedPost: quotedPost,
            createdAt: new Date(),
            updatedAt: new Date()
        } as any;

        mockPostRepository.findOneBy = mock(() => Promise.resolve(quotedPost));
        mockPostRepository.create = mock(() => ({}));
        mockPostRepository.save = mock(() => Promise.resolve(savedPost));
        mockMentionService.createMentionsForPost = mock(() => Promise.resolve());

        const createPostData = {
            content: "This is a quote",
            quotedPostId: quotedPostId
        };

        // Act
        const result = await handler.handle({ data: createPostData, user, profile });

        // Assert
        expect(result.content).toBe("This is a quote");
        expect(result.quotedPostId).toBe(quotedPostId);
        expect(mockPostRepository.create).toHaveBeenCalledWith({
            user,
            profile,
            content: "This is a quote",
            repliedPost: undefined,
            quotedPost: quotedPost
        });
        expect(mockPostRepository.save).toHaveBeenCalled();
        expect(mockMentionService.createMentionsForPost).toHaveBeenCalledWith(
            savedPost,
            "This is a quote"
        );
    });

    it("should call mention service with post containing mentions", async () => {
        // Arrange
        const user = zocker(userDto).generate();
        const profile = zocker(profileDto).generate();
        const savedPostId = zocker(idDto).generate();

        const contentWithMentions = "Hey @john and @jane, check this out!";

        const savedPost = {
            id: savedPostId,
            user,
            profile,
            content: contentWithMentions,
            repliedPost: null,
            createdAt: new Date(),
            updatedAt: new Date()
        } as any;

        mockPostRepository.create = mock(() => ({}));
        mockPostRepository.save = mock(() => Promise.resolve(savedPost));
        mockMentionService.createMentionsForPost = mock(() => Promise.resolve());

        // Act
        await handler.handle({
            data: { content: contentWithMentions },
            user,
            profile
        });

        // Assert
        expect(mockMentionService.createMentionsForPost).toHaveBeenCalledWith(
            savedPost,
            contentWithMentions
        );
    });
});
