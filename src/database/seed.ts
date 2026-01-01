import "reflect-metadata";
import { appDataSource } from "./data-source";
import { zocker } from "zocker";
import { createUserDto, UserDto } from "@/app/dtos/user.dtos";
import { CreateUserHandler } from "@/app/handlers/user/create-user.handler";
import { createPostDto, PostDto } from "@/app/dtos/post.dtos";
import { CreatePostHandler } from "@/app/handlers/post/create-post.handler";
import { LikePostHandler } from "@/app/handlers/like/like-post.handler";
import { RepostPostHandler } from "@/app/handlers/repost/repost-post.handler";
import { MuteProfileHandler } from "@/app/handlers/mute/mute-profile.handler";
import { BlockProfileHandler } from "@/app/handlers/block/block-profile.handler";
import { FollowProfileHandler } from "@/app/handlers/follow/follow-profile.handler";
import { ProfileDto } from "@/app/dtos/profile.dtos";

type UserWithProfile = UserDto & { profile: ProfileDto };

async function main() {
    await appDataSource.initialize();

    const users = await createUsersWithProfile();
    const posts = await createPosts(users);

    await createPostInteractions(posts, users);
    await createProfileRelationships(users);

    await appDataSource.destroy();
}

async function createUsersWithProfile() {
    const userDtos = zocker(createUserDto)
        .supply(createUserDto.shape.password, "12345678")
        .setSeed(123)
        .generateMany(10);
    return await Promise.all(
        userDtos.map(async dto => await CreateUserHandler.default.handle(dto))
    );
}

function getRandom<T>(array: T[]) {
    const index = Math.floor(Math.random() * array.length);
    return array[index];
}

async function createPosts(users: UserWithProfile[]) {
    const posts: PostDto[] = [];
    const postDtos = zocker(createPostDto)
        .supply(createPostDto.shape.repliedPostId, null)
        .supply(createPostDto.shape.quotedPostId, null)
        .setSeed(123)
        .generateMany(20);

    for (const dto of postDtos) {
        const user = users[Math.floor(Math.random() * users.length)];
        if (Math.random() < 0.5) {
            dto.repliedPostId = getRandom(posts)?.id || null;
        }
        if (Math.random() < 0.5) {
            dto.quotedPostId = getRandom(posts)?.id || null;
        }
        const created = await CreatePostHandler.default.handle(dto, user, user.profile);
        posts.push(created);
    }

    return posts;
}

async function createPostInteractions(posts: PostDto[], users: UserWithProfile[]) {
    const interactionHandlers = [LikePostHandler, RepostPostHandler];
    for (const handler of interactionHandlers) {
        for (const post of posts) {
            for (const user of users) {
                if (Math.random() < 0.5) continue;
                await handler.default.handle(post.id, user, user.profile);
            }
        }
    }
}

async function createProfileRelationships(users: UserWithProfile[]) {
    // Block must be the last to prevent error on follow
    const relationshipHandlers = [MuteProfileHandler, FollowProfileHandler, BlockProfileHandler];
    for (const handler of relationshipHandlers) {
        for (const sourceUser of users) {
            for (const targetUser of users) {
                if (sourceUser.id === targetUser.id) continue;
                if (Math.random() < 0.5) continue;
                await handler.default.handle(sourceUser.profile.id, targetUser.profile.id);
            }
        }
    }
}

try {
    await main();
    console.log("Seed completed successfully");
}
catch (err) {
    console.error(err);
    try { await appDataSource.destroy(); }
    catch { }
    process.exit(1);
}
