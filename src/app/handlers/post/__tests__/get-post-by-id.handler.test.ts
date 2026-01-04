import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Repository } from "typeorm";
import { GetPostByIdHandler } from "../get-post-by-id.handler";
import { zocker } from "zocker";
import { idDto } from "@/app/dtos/common.dtos";
import { NotFoundError } from "@/app/errors";
import { Post } from "@/database/entities/post";
import { InteractionType } from "@/database/entities/post-interaction";

describe("GetPostByIdHandler", () => {
    let handler: GetPostByIdHandler;
    let mockPostRepository: Repository<Post>;
    let qb: any;
    let rawEntitiesReturn: { entities: any[]; raw: any[] };
    let capturedParameters: any;

    beforeEach(() => {
        rawEntitiesReturn = { entities: [], raw: [] };
        capturedParameters = {};

        const mockSubQb = {
            select: () => mockSubQb,
            from: () => mockSubQb,
            where: (query: string, params?: any) => {
                if (params) Object.assign(capturedParameters, params);
                return mockSubQb;
            },
            andWhere: (query: string, params?: any) => {
                if (params) Object.assign(capturedParameters, params);
                return mockSubQb;
            }
        };

        qb = {
            leftJoinAndSelect: () => qb,
            leftJoin: () => qb,
            addSelect: (selection: any, alias: string) => {
                if (typeof selection === 'function') {
                    selection(mockSubQb);
                }
                return qb;
            },
            where: (query: string, params?: any) => {
                if (params) Object.assign(capturedParameters, params);
                return qb;
            },
            setParameters: (params: any) => {
                if (params) Object.assign(capturedParameters, params);
                return qb;
            },
            groupBy: () => qb,
            addGroupBy: () => qb,
            getRawAndEntities: () => Promise.resolve(rawEntitiesReturn),
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
        expect(capturedParameters.like).toBe(InteractionType.Like);
        expect(capturedParameters.repost).toBe(InteractionType.Repost);
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
