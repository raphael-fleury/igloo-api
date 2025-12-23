import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Repository } from "typeorm";
import { UnrepostPostHandler } from "../unrepost-post.handler";
import { InteractionType, PostInteraction } from "@/database/entities/post-interaction";
import { NotFoundError } from "@/app/errors";
import { User } from "@/database/entities/user";
import { Profile } from "@/database/entities/profile";
import { Post } from "@/database/entities/post";

describe("UnrepostPostHandler", () => {
    let handler: UnrepostPostHandler;
    let mockPostInteractionRepository: Repository<PostInteraction>;

    beforeEach(() => {
        mockPostInteractionRepository = {
            findOne: mock(() => Promise.resolve(null)),
            remove: mock(data => Promise.resolve(data))
        } as any;

        handler = new UnrepostPostHandler(mockPostInteractionRepository);
    });

    it("should unrepost post successfully when repost exists", async () => {
        // Arrange
        const profileId = "14ae85e0-ec24-4c44-bfc7-1d0ba895f51d";
        const postId = "99e85e01-ec24-4c44-bfc7-1d0ba895f51e";
        
        const user = { id: "b316b948-8f6c-4284-8b38-a68ca4d3dee0" } as User;
        const profile = { id: profileId } as Profile;
        const post = { id: postId } as Post;

        const existingRepost = {
            id: "repost-id",
            user,
            profile,
            post,
            interactionType: InteractionType.Repost,
            createdAt: new Date(),
            updatedAt: new Date()
        } as PostInteraction;

        mockPostInteractionRepository.findOne = mock(() => Promise.resolve(existingRepost));

        // Act
        const result = await handler.handle(profileId, postId);

        // Assert
        expect(result.message).toBe("Post unreposted successfully");
        expect(result.unrepostedAt).toBeDefined();
        expect(mockPostInteractionRepository.findOne).toHaveBeenCalledWith({
            where: {
                profile: { id: profileId },
                post: { id: postId },
                interactionType: InteractionType.Repost
            }
        });
        expect(mockPostInteractionRepository.remove).toHaveBeenCalledWith(existingRepost);
    });

    it("should throw NotFoundError when repost does not exist", async () => {
        // Arrange
        const profileId = "14ae85e0-ec24-4c44-bfc7-1d0ba895f51d";
        const postId = "99e85e01-ec24-4c44-bfc7-1d0ba895f51e";

        mockPostInteractionRepository.findOne = mock(() => Promise.resolve(null));

        // Act & Assert
        expect(handler.handle(profileId, postId))
            .rejects.toThrow(NotFoundError);
        expect(handler.handle(profileId, postId))
            .rejects.toThrow("Repost for this post not found");
        expect(mockPostInteractionRepository.remove).not.toHaveBeenCalled();
    });
});

