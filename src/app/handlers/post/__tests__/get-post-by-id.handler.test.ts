import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Repository } from "typeorm";
import { GetPostByIdHandler } from "../get-post-by-id.handler";
import { zocker } from "zocker";
import { idDto } from "@/app/dtos/common.dtos";
import { NotFoundError } from "@/app/errors";
import { Post } from "@/database/entities/post";

describe("GetPostByIdHandler", () => {
    let handler: GetPostByIdHandler;
    let mockPostRepository: Repository<Post>;
    let qb: any;
    let rawEntitiesReturn: { entities: any[]; raw: any[] };
    let capturedParameters: any;

    beforeEach(() => {
        rawEntitiesReturn = { entities: [], raw: [] };

        qb = {
            apply: mock(() => qb),
            take: mock(() => qb),
            getRawAndEntities: mock(() => Promise.resolve(rawEntitiesReturn)),
            where: mock(() => qb),
            groupBy: mock(() => qb),
            addGroupBy: mock(() => qb),
        };

        mockPostRepository = {
            createQueryBuilder: mock(() => qb),
        } as any;

        handler = new GetPostByIdHandler(mockPostRepository);
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

        rawEntitiesReturn = {
            entities: [post as Post],
            raw: [{ likes: 3, reposts: 2, quotes: 0, replies: 0 }],
        };

        // Act
        const result = await handler.handle(post.id);

        // Assert
        expect(result.id).toBe(post.id);
        expect(result.content).toBe(post.content);
        expect(result.profile.id).toBe(profileId);
        expect(result.likes).toBe(3);
        expect(result.reposts).toBe(2);
        expect((mockPostRepository as any).createQueryBuilder).toHaveBeenCalledWith("post");
        expect(qb.apply).toHaveBeenCalled();
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
