import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Repository } from "typeorm";
import { UnlikePostHandler } from "../unlike-post.handler";
import { zocker } from "zocker";
import { idDto } from "@/app/dtos/common.dtos";
import { InteractionType, PostInteraction } from "@/database/entities/post-interaction";
import { ConflictError } from "@/app/errors";
import { User } from "@/database/entities/user";
import { Profile } from "@/database/entities/profile";
import { Post } from "@/database/entities/post";

describe("UnlikePostHandler", () => {
    let handler: UnlikePostHandler;
    let mockPostInteractionRepository: Repository<PostInteraction>;

    beforeEach(() => {
        mockPostInteractionRepository = {
            findOne: mock(() => Promise.resolve(null)),
            remove: mock(data => Promise.resolve(data))
        } as any;

        handler = new UnlikePostHandler(mockPostInteractionRepository);
    });

    it("should unlike post successfully when like exists", async () => {
        // Arrange
        const profileId = zocker(idDto).generate();
        const postId = zocker(idDto).generate();
        
        const user = { id: "b316b948-8f6c-4284-8b38-a68ca4d3dee0" } as User;
        const profile = { id: profileId } as Profile;
        const post = { id: postId } as Post;

        const existingLike = {
            id: "like-id",
            user,
            profile,
            post,
            interactionType: InteractionType.Like,
            createdAt: new Date(),
            updatedAt: new Date()
        } as PostInteraction;

        mockPostInteractionRepository.findOne = mock(() => Promise.resolve(existingLike));

        // Act
        const result = await handler.handle(profileId, postId);

        // Assert
        expect(result.message).toBe("Post unliked successfully");
        expect(result.unlikedAt).toBeDefined();
        expect(mockPostInteractionRepository.findOne).toHaveBeenCalledWith({
            where: {
                profile: { id: profileId },
                post: { id: postId },
                interactionType: InteractionType.Like
            }
        });
        expect(mockPostInteractionRepository.remove).toHaveBeenCalledWith(existingLike);
    });

    it("should throw ConflictError when like does not exist", async () => {
        // Arrange
        const profileId = zocker(idDto).generate();
        const postId = zocker(idDto).generate();

        mockPostInteractionRepository.findOne = mock(() => Promise.resolve(null));

        // Act & Assert
        expect(handler.handle(profileId, postId))
            .rejects.toThrow(ConflictError);
        expect(handler.handle(profileId, postId))
            .rejects.toThrow("Like for this post not found");
        expect(mockPostInteractionRepository.remove).not.toHaveBeenCalled();
    });
});

