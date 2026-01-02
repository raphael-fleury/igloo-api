import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Repository } from "typeorm";
import { zocker } from "zocker";
import { FindPostsHandler } from "../find-posts.handler";
import { postDto } from "@/app/dtos/post.dtos";
import { Post } from "@/database/entities/post";

describe("FindPostsHandler", () => {
    let handler: FindPostsHandler;
    let mockRepository: Repository<Post>;
    let qb: any;
    let rawEntitiesReturn: { entities: any[]; raw: any[] };

    beforeEach(() => {
        rawEntitiesReturn = { entities: [], raw: [] };

        qb = {
            leftJoinAndSelect: mock(() => qb),
            leftJoin: mock(() => qb),
            addSelect: mock(() => qb),
            setParameters: mock(() => qb),
            groupBy: mock(() => qb),
            addGroupBy: mock(() => qb),
            orderBy: mock(() => qb),
            andWhere: mock(() => qb),
            getRawAndEntities: mock(() => Promise.resolve(rawEntitiesReturn)),
        };

        mockRepository = {
            createQueryBuilder: mock(() => qb),
        } as any;

        handler = new FindPostsHandler(mockRepository);
    });

    it("should return posts without filters", async () => {
        // Arrange
        const p1Data = zocker(postDto).generate();
        const p2Data = zocker(postDto).generate();
        
        // Mock entities returned by TypeORM
        const p1 = {
            ...p1Data,
            user: { id: "user-1" },
            profile: { ...p1Data.profile, createdAt: new Date(), updatedAt: new Date() },
            repliedPost: undefined,
            quotedPost: undefined,
        };
        const p2 = {
            ...p2Data,
            user: { id: "user-2" },
            profile: { ...p2Data.profile, createdAt: new Date(), updatedAt: new Date() },
            repliedPost: undefined,
            quotedPost: undefined,
        };

        rawEntitiesReturn.entities = [p1, p2];
        rawEntitiesReturn.raw = [
            { likes: "10", reposts: "5", replies: "2", quotes: "1" },
            { likes: "0", reposts: "0", replies: "0", quotes: "0" }
        ];

        // Act
        const result = await handler.handle({});

        // Assert
        expect(result.length).toBe(2);
        expect(result[0].id).toBe(p1.id);
        expect(result[0].likes).toBe(10);
        expect(result[1].id).toBe(p2.id);
        expect(result[1].likes).toBe(0);
        
        expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith("post");
        expect(qb.orderBy).toHaveBeenCalledWith("post.createdAt", "DESC");
    });

    it("should apply content and profile filters", async () => {
        // Arrange
        const q = { content: "hello", from: "alice" };
        
        // Act
        await handler.handle(q);

        // Assert
        expect(qb.andWhere).toHaveBeenCalledWith("post.content ILIKE :content", { content: `%${q.content}%` });
        expect(qb.andWhere).toHaveBeenCalledWith("profile.username = :from", { from: q.from });
    });

    it("should apply date filters", async () => {
        // Arrange
        const since = new Date("2023-01-01");
        const until = new Date("2023-12-31");
        const q = { since, until };
        
        // Act
        await handler.handle(q);

        // Assert
        expect(qb.andWhere).toHaveBeenCalledWith("post.created_at >= :since", { since });
        expect(qb.andWhere).toHaveBeenCalledWith("post.created_at <= :until", { until });
    });

    it("should filter by repliedPost and quotedPost", async () => {
        // Arrange
        const repliedId = "replied-id";
        const quotedId = "quoted-id";
        
        // Act
        await handler.handle({ repliedPostId: repliedId, quotedPostId: quotedId });

        // Assert
        expect(qb.andWhere).toHaveBeenCalledWith("repliedPost.id = :repliedPostId", { repliedPostId: repliedId });
        expect(qb.andWhere).toHaveBeenCalledWith("quotedPost.id = :quotedPostId", { quotedPostId: quotedId });
    });

    it("should filter by repliedProfile and quotedProfile", async () => {
        // Arrange
        const repliedUsername = "replied_user";
        const quotedUsername = "quoted_user";
        
        // Act
        await handler.handle({
            repliedProfileUsername: repliedUsername,
            quotedProfileUsername: quotedUsername
        });

        // Assert
        expect(qb.andWhere).toHaveBeenCalledWith("repliedProfile.username = :repliedProfileUsername", {
            repliedProfileUsername: repliedUsername
        });
        expect(qb.andWhere).toHaveBeenCalledWith("quotedProfile.username = :quotedProfileUsername", {
            quotedProfileUsername: quotedUsername
        });
    });
});
