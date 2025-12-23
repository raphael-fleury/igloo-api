import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Repository } from "typeorm";
import { UnlikePostHandler } from "../unlike-post.handler";
import { Like } from "@/database/entities/like";
import { NotFoundError } from "@/app/errors";
import { User } from "@/database/entities/user";
import { Profile } from "@/database/entities/profile";
import { Post } from "@/database/entities/post";

describe("UnlikePostHandler", () => {
    let handler: UnlikePostHandler;
    let mockLikeRepository: Repository<Like>;

    beforeEach(() => {
        mockLikeRepository = {
            findOne: mock(() => Promise.resolve(null)),
            remove: mock(data => Promise.resolve(data))
        } as any;

        handler = new UnlikePostHandler(mockLikeRepository);
    });

    it("should unlike post successfully when like exists", async () => {
        // Arrange
        const profileId = "14ae85e0-ec24-4c44-bfc7-1d0ba895f51d";
        const postId = "99e85e01-ec24-4c44-bfc7-1d0ba895f51e";
        
        const user = { id: "b316b948-8f6c-4284-8b38-a68ca4d3dee0" } as User;
        const profile = { id: profileId } as Profile;
        const post = { id: postId } as Post;

        const existingLike = {
            id: "like-id",
            user,
            profile,
            post,
            createdAt: new Date(),
            updatedAt: new Date()
        } as Like;

        mockLikeRepository.findOne = mock(() => Promise.resolve(existingLike));

        // Act
        const result = await handler.handle(profileId, postId);

        // Assert
        expect(result.message).toBe("Post unliked successfully");
        expect(result.unlikedAt).toBeDefined();
        expect(mockLikeRepository.findOne).toHaveBeenCalledWith({
            where: {
                profile: { id: profileId },
                post: { id: postId }
            }
        });
        expect(mockLikeRepository.remove).toHaveBeenCalledWith(existingLike);
    });

    it("should throw NotFoundError when like does not exist", async () => {
        // Arrange
        const profileId = "14ae85e0-ec24-4c44-bfc7-1d0ba895f51d";
        const postId = "99e85e01-ec24-4c44-bfc7-1d0ba895f51e";

        mockLikeRepository.findOne = mock(() => Promise.resolve(null));

        // Act & Assert
        expect(handler.handle(profileId, postId))
            .rejects.toThrow(NotFoundError);
        expect(handler.handle(profileId, postId))
            .rejects.toThrow("Like for this post not found");
        expect(mockLikeRepository.remove).not.toHaveBeenCalled();
    });
});

