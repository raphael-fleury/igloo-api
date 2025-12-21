import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Repository } from "typeorm";
import { CreatePostHandler } from "../create-post.handler";
import { Post } from "@/database/entities/post";
import { User } from "@/database/entities/user";
import { Profile } from "@/database/entities/profile";
import { NotFoundError } from "@/app/errors";

describe("CreatePostHandler", () => {
    let handler: CreatePostHandler;
    let mockPostRepository: Repository<Post>;
    let mockUserRepository: Repository<User>;
    let mockProfileRepository: Repository<Profile>;

    beforeEach(() => {
        mockPostRepository = {
            findOneBy: mock(() => Promise.resolve(null)),
            create: mock((data) => data),
            save: mock((data) => Promise.resolve({ ...data, id: "post-id", createdAt: new Date(), updatedAt: new Date() }))
        } as any;

        mockUserRepository = {
            findOneBy: mock(() => Promise.resolve(null))
        } as any;

        mockProfileRepository = {
            findOneBy: mock(() => Promise.resolve(null))
        } as any;

        handler = new CreatePostHandler(mockPostRepository, mockUserRepository, mockProfileRepository);
    });

    it("should create post successfully when user and profile exist", async () => {
        // Arrange
        const userId = "b316b948-8f6c-4284-8b38-a68ca4d3dee0";
        const profileId = "14ae85e0-ec24-4c44-bfc7-1d0ba895f51d";
        const postId = "99e85e01-ec24-4c44-bfc7-1d0ba895f51e";
        const mockUser = { id: userId, email: "user@example.com" } as User;
        const mockProfile = { id: profileId, username: "testuser" } as Profile;

        mockUserRepository.findOneBy = mock(() => Promise.resolve(mockUser));
        mockProfileRepository.findOneBy = mock(() => Promise.resolve(mockProfile));

        mockPostRepository.save = mock((data) => Promise.resolve({
            ...data,
            id: postId,
            userId: userId,
            profileId: profileId,
            createdAt: new Date(),
            updatedAt: new Date()
        }));

        const createPostData = {
            userId,
            profileId,
            content: "This is a test post"
        };

        // Act
        const result = await handler.handle(createPostData);

        // Assert
        expect(result.content).toBe("This is a test post");
        expect(mockPostRepository.create).toHaveBeenCalledWith({
            user: mockUser,
            profile: mockProfile,
            content: "This is a test post",
            replyToPost: undefined
        });
        expect(mockPostRepository.save).toHaveBeenCalled();
    });

    it("should create post with reply when replyToPostId is provided", async () => {
        // Arrange
        const userId = "b316b948-8f6c-4284-8b38-a68ca4d3dee0";
        const profileId = "14ae85e0-ec24-4c44-bfc7-1d0ba895f51d";
        const replyToPostId = "99e85e01-ec24-4c44-bfc7-1d0ba895f51e";
        const newPostId = "88e85e01-ec24-4c44-bfc7-1d0ba895f51f";
        const mockUser = { id: userId, email: "user@example.com" } as User;
        const mockProfile = { id: profileId, username: "testuser" } as Profile;
        const mockReplyToPost = { id: replyToPostId, content: "Original post" } as Post;

        let userCalled = false;
        mockUserRepository.findOneBy = mock(() => {
            if (!userCalled) {
                userCalled = true;
                return Promise.resolve(mockUser);
            }
            return Promise.resolve(null);
        });

        let profileCalled = false;
        mockProfileRepository.findOneBy = mock(() => {
            if (!profileCalled) {
                profileCalled = true;
                return Promise.resolve(mockProfile);
            }
            return Promise.resolve(null);
        });

        mockPostRepository.findOneBy = mock(() => Promise.resolve(mockReplyToPost));

        mockPostRepository.save = mock((data) => Promise.resolve({
            ...data,
            id: newPostId,
            userId: userId,
            profileId: profileId,
            replyToPostId: replyToPostId,
            createdAt: new Date(),
            updatedAt: new Date()
        }));

        const createPostData = {
            userId,
            profileId,
            content: "This is a reply",
            replyToPostId
        };

        // Act
        const result = await handler.handle(createPostData);

        // Assert
        expect(result.content).toBe("This is a reply");
        expect(mockPostRepository.create).toHaveBeenCalledWith({
            user: mockUser,
            profile: mockProfile,
            content: "This is a reply",
            replyToPost: mockReplyToPost
        });
    });

    it("should throw NotFoundError when user does not exist", async () => {
        // Arrange
        const createPostData = {
            userId: "non-existent-user",
            profileId: "profile-id",
            content: "Test post"
        };

        // Act & Assert
        expect(async () => {
            await handler.handle(createPostData);
        }).toThrow(NotFoundError);
    });

    it("should throw NotFoundError when profile does not exist", async () => {
        // Arrange
        const userId = "user-id";
        const mockUser = { id: userId, email: "user@example.com" } as User;

        mockUserRepository.findOneBy = mock(() => Promise.resolve(mockUser));

        const createPostData = {
            userId,
            profileId: "non-existent-profile",
            content: "Test post"
        };

        // Act & Assert
        expect(async () => {
            await handler.handle(createPostData);
        }).toThrow(NotFoundError);
    });

    it("should throw NotFoundError when replyToPost does not exist", async () => {
        // Arrange
        const userId = "user-id";
        const profileId = "profile-id";
        const mockUser = { id: userId, email: "user@example.com" } as User;
        const mockProfile = { id: profileId, username: "testuser" } as Profile;

        mockUserRepository.findOneBy = mock(() => Promise.resolve(mockUser));
        mockProfileRepository.findOneBy = mock(() => Promise.resolve(mockProfile));

        const createPostData = {
            userId,
            profileId,
            content: "This is a reply",
            replyToPostId: "non-existent-post"
        };

        // Act & Assert
        expect(async () => {
            await handler.handle(createPostData);
        }).toThrow(NotFoundError);
    });
});
