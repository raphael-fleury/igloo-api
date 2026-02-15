import z from "zod";
import { dateDto, idDto, pageDto, pageQueryDto } from "./common.dtos";
import { profileDto } from "./profile.dtos";

const MAX_POST_CONTENT_LENGTH = 300;

const basePostDto = z.object({
    content: z.string().min(1).max(MAX_POST_CONTENT_LENGTH)
});

const createdPostDto = basePostDto.extend({
    id: idDto,
    createdAt: dateDto,
});

export const mentionDto = z.object({
    id: idDto,
    mentionedProfile: profileDto,
    usernameAtMention: z.string()
});

export const postDto = createdPostDto.extend({
    profile: profileDto,
    repliedPostId: idDto.nullable().optional(),
    quotedPostId: idDto.nullable().optional()
});

export const postDetailedDto = createdPostDto.extend({
    profile: profileDto,
    repliedPost: postDto.nullable().optional(),
    quotedPost: postDto.nullable().optional(),
    mentions: z.array(mentionDto).default([]),
    likes: z.int(),
    reposts: z.int(),
    replies: z.int(),
    quotes: z.int()
})

export const createPostDto = basePostDto.extend({
    repliedPostId: idDto.nullish(),
    quotedPostId: idDto.nullish()
});

export const postQueryDto = z.object({
    content: z.string().max(MAX_POST_CONTENT_LENGTH),
    from: z.string(),
    since: dateDto,
    until: dateDto,
    repliedPostId: idDto,
    quotedPostId: idDto,
    repliedProfileUsername: z.string(),
    quotedProfileUsername: z.string()
}).partial().extend(pageQueryDto.shape);

export const postsPageDto = pageDto.extend({
    items: z.array(postDetailedDto)
});

export type PostDto = z.infer<typeof postDto>;
export type PostDetailedDto = z.infer<typeof postDetailedDto>;
export type CreatePostDto = z.infer<typeof createPostDto>;
export type PostQueryDto = z.infer<typeof postQueryDto>;
export type PostsPageDto = z.infer<typeof postsPageDto>;
export type MentionDto = z.infer<typeof mentionDto>;