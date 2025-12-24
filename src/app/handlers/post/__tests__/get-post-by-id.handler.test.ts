import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Repository } from "typeorm";
import { GetPostByIdHandler } from "../get-post-by-id.handler";
import { zocker } from "zocker";
import { postDto } from "@/app/dtos/post.dtos";
import { idDto } from "@/app/dtos/common.dtos";
import { Post } from "@/database/entities/post";
import { NotFoundError } from "@/app/errors";

describe("GetPostByIdHandler", () => {
    let handler: GetPostByIdHandler;
    let mockPostRepository: Repository<Post>;

    beforeEach(() => {
        mockPostRepository = {
            findOne: mock(() => Promise.resolve(null))
        } as any;

        handler = new GetPostByIdHandler(mockPostRepository);
    });

    it("should return post when post exists", async () => {
        // Arrange
        const postData = zocker(postDto).generate();
        const postId = postData.id;
        const userId = postData.userId;
        const profileId = postData.profileId;
        const mockPost = {
            id: postId,
            user: { id: userId },
            profile: { id: profileId },
            content: postData.content,
            repliedPost: null,
            quotedPost: null,
            createdAt: postData.createdAt,
            updatedAt: postData.updatedAt
        } as any;

        mockPostRepository.findOne = mock(() => Promise.resolve(mockPost));

        // Act
        const result = await handler.handle(postId);

        // Assert
        expect(result.id).toBe(postId);
        expect(result.content).toBe(postData.content);
        expect(mockPostRepository.findOne).toHaveBeenCalledWith({
            where: { id: postId },
            relations: ['quotedPost']
        });
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
