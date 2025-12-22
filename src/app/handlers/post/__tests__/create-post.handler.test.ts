import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Repository } from "typeorm";
import { CreatePostHandler } from "../create-post.handler";
import { NotFoundError } from "@/app/errors";
import { Post } from "@/database/entities/post";
import { User } from "@/database/entities/user";
import { Profile } from "@/database/entities/profile";

describe("CreatePostHandler", () => {
    let handler: CreatePostHandler;
    let mockPostRepository: Repository<Post>;

    beforeEach(() => {
        mockPostRepository = {
            findOneBy: mock(() => Promise.resolve(null)),
            create: mock((data) => data),
            save: mock((data) => Promise.resolve({ ...data, id: "post-id", createdAt: new Date(), updatedAt: new Date() }))
        } as any;

        handler = new CreatePostHandler(mockPostRepository);
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
            replyToPost: undefined
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
});
