import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Repository } from "typeorm";
import { GetPostByIdHandler } from "../get-post-by-id.handler";
import { zocker } from "zocker";
import { postDto } from "@/app/dtos/post.dtos";
import { idDto } from "@/app/dtos/common.dtos";
import { NotFoundError } from "@/app/errors";
import { Post } from "@/database/entities/post";

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
        const post = {
            ...zocker(postDto).generate(),
            repliedPost: undefined,
            quotedPost: undefined,
            user: { id: zocker(idDto).generate() },
            profile: { id: zocker(idDto).generate() }
        } 

        mockPostRepository.findOne = mock(() => Promise.resolve(post as Post));

        // Act
        const result = await handler.handle(post.id);

        // Assert
        expect(result.id).toBe(post.id);
        expect(result.content).toBe(post.content);
        expect(mockPostRepository.findOne).toHaveBeenCalledWith({
            where: { id: post.id },
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
