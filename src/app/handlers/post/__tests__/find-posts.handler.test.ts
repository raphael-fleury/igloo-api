import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Repository, Like } from "typeorm";
import { zocker } from "zocker";
import { FindPostsHandler } from "../find-posts.handler";
import { postDto } from "@/app/dtos/post.dtos";
import { Post } from "@/database/entities/post";
import { Profile } from "@/database/entities/profile";
import { User } from "@/database/entities/user";

describe("FindPostsHandler", () => {
    let handler: FindPostsHandler;
    let mockRepository: Repository<Post>;

    beforeEach(() => {
        mockRepository = {
            find: mock(() => Promise.resolve([])),
        } as any;
        handler = new FindPostsHandler(mockRepository);
    });

    it("should return posts without filters", async () => {
        // Arrange
        const p1Data = zocker(postDto).generate();
        const p2Data = zocker(postDto).generate();
        const p1 = {
            id: p1Data.id,
            user: { id: "user-1" } as User,
            profile: { id: "profile-1" } as Profile,
            content: p1Data.content,
            createdAt: p1Data.createdAt,
            updatedAt: p1Data.updatedAt
        } as Post;
        const p2 = {
            id: p2Data.id,
            user: { id: "user-2" } as User,
            profile: { id: "profile-2" } as Profile,
            content: p2Data.content,
            createdAt: p2Data.createdAt,
            updatedAt: p2Data.updatedAt
        } as Post;
        mockRepository.find = mock(() => Promise.resolve([p1, p2]));

        // Act
        const result = await handler.handle({});

        // Assert
        expect(result.length).toBe(2);
        expect(result[0].id).toBe(p1.id);
        expect(result[1].id).toBe(p2.id);
        expect(mockRepository.find).toHaveBeenCalledWith({
            where: {},
            relations: {
                user: true,
                profile: true,
                repliedPost: { profile: true },
                quotedPost: { profile: true }
            },
            order: { createdAt: "DESC" }
        });
    });

    it("should apply content and profile filters", async () => {
        // Arrange
        const q = { content: "hello", from: "profile-1" };
        const postData = zocker(postDto).generate();
        const post = {
            id: postData.id,
            user: { id: "user-1" } as User,
            profile: { id: q.from } as Profile,
            content: "say hello world",
            createdAt: postData.createdAt,
            updatedAt: postData.updatedAt
        } as Post;
        mockRepository.find = mock(() => Promise.resolve([post]));

        // Act
        const result = await handler.handle(q as any);

        // Assert
        expect(result.length).toBe(1);
        expect(mockRepository.find).toHaveBeenCalledWith({
            where: {
                content: Like(`%${q.content}%`),
                profile: { id: q.from }
            },
            relations: {
                user: true,
                profile: true,
                repliedPost: { profile: true },
                quotedPost: { profile: true }
            },
            order: { createdAt: "DESC" }
        });
    });

    it("should filter by repliedPost and quotedPost", async () => {
        // Arrange
        const repliedId = "replied-id";
        const quotedId = "quoted-id";
        const postData = zocker(postDto).generate();
        const post = {
            id: postData.id,
            user: { id: "user-1" } as User,
            profile: { id: "profile-1" } as Profile,
            content: postData.content,
            repliedPost: { id: repliedId } as Post,
            quotedPost: { id: quotedId } as Post,
            createdAt: postData.createdAt,
            updatedAt: postData.updatedAt
        } as Post;
        mockRepository.find = mock(() => Promise.resolve([post]));

        // Act
        const result = await handler.handle({ repliedPostId: repliedId, quotedPostId: quotedId } as any);

        // Assert
        expect(result.length).toBe(1);
        expect(mockRepository.find).toHaveBeenCalledWith({
            where: {
                repliedPost: { id: repliedId },
                quotedPost: { id: quotedId }
            },
            relations: {
                user: true,
                profile: true,
                repliedPost: { profile: true },
                quotedPost: { profile: true }
            },
            order: { createdAt: "DESC" }
        });
    });

    it("should filter by repliedProfile and quotedProfile via relations", async () => {
        // Arrange
        const repliedProfileId = "rp-1";
        const quotedProfileId = "qp-1";
        const postData = zocker(postDto).generate();
        const post = {
            id: postData.id,
            user: { id: "user-1" } as User,
            profile: { id: "profile-1" } as Profile,
            content: postData.content,
            repliedPost: { id: "replied", profile: { id: repliedProfileId } as Profile } as Post,
            quotedPost: { id: "quoted", profile: { id: quotedProfileId } as Profile } as Post,
            createdAt: postData.createdAt,
            updatedAt: postData.updatedAt
        } as Post;
        mockRepository.find = mock(() => Promise.resolve([post]));

        // Act
        const result = await handler.handle({
            repliedProfileUsername: repliedProfileId,
            quotedProfileUsername: quotedProfileId
        } as any);

        // Assert
        expect(result.length).toBe(1);
        expect(mockRepository.find).toHaveBeenCalledWith({
            where: {
                repliedPost: { profile: { username: repliedProfileId } },
                quotedPost: { profile: { username: quotedProfileId } }
            },
            relations: {
                user: true,
                profile: true,
                repliedPost: { profile: true },
                quotedPost: { profile: true }
            },
            order: { createdAt: "DESC" }
        });
    });
});
