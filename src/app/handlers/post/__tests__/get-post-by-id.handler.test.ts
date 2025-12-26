import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Repository } from "typeorm";
import { GetPostByIdHandler } from "../get-post-by-id.handler";
import { zocker } from "zocker";
import { idDto } from "@/app/dtos/common.dtos";
import { NotFoundError } from "@/app/errors";
import { Post } from "@/database/entities/post";
import { InteractionType, PostInteraction } from "@/database/entities/post-interaction";

describe("GetPostByIdHandler", () => {
    let handler: GetPostByIdHandler;
    let mockPostRepository: Repository<Post>;
    let mockPostInteractionRepository: Repository<PostInteraction>;

    beforeEach(() => {
        mockPostRepository = {
            findOne: mock(() => Promise.resolve(null))
        } as any;
        mockPostInteractionRepository = {
            count: mock(() => Promise.resolve(0))
        } as any;

        handler = new GetPostByIdHandler(mockPostRepository, mockPostInteractionRepository);
    });

    it("should return post when post exists", async () => {
        // Arrange
        const profileId = zocker(idDto).generate();
        const post = {
            id: zocker(idDto).generate(),
            content: "Hello world",
            profile: { id: profileId, username: "alice", displayName: "Alice", bio: "", createdAt: new Date(), updatedAt: new Date() },
            repliedPost: undefined,
            quotedPost: undefined,
            createdAt: new Date(),
            updatedAt: new Date()
        }

        mockPostRepository.findOne = mock(() => Promise.resolve(post as Post));
        (mockPostInteractionRepository.count as any) = mock((args: any) => {
            if (args.where.interactionType === InteractionType.Like) return Promise.resolve(3);
            if (args.where.interactionType === InteractionType.Repost) return Promise.resolve(2);
            return Promise.resolve(0);
        });

        // Act
        const result = await handler.handle(post.id);

        // Assert
        expect(result.id).toBe(post.id);
        expect(result.content).toBe(post.content);
        expect(result.profile.id).toBe(profileId);
        expect(result.likes).toBe(3);
        expect(result.reposts).toBe(2);
        expect(mockPostRepository.findOne).toHaveBeenCalledWith({
            where: { id: post.id },
            relations: ['profile', 'repliedPost', 'quotedPost']
        });
        expect(mockPostInteractionRepository.count).toHaveBeenCalledTimes(2);
    });

    it("should throw NotFoundError when post does not exist", async () => {
        // Arrange
        const postId = zocker(idDto).generate();

        // Act & Assert
        expect(async () => {
            await handler.handle(postId);
        }).toThrow(NotFoundError);
    });
});
