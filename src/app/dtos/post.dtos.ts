import z from "zod";
import { idDto } from "./common.dtos";

const MAX_POST_CONTENT_LENGTH = 300;

const basePostDto = z.object({
    content: z.string().min(1).max(MAX_POST_CONTENT_LENGTH)
});

export const postDto = basePostDto.extend({
    id: idDto,
    repliedPostId: idDto.nullable().optional(),
    quotedPostId: idDto.nullable().optional(),
    createdAt: z.date(),
    updatedAt: z.date()
});

export const createPostDto = basePostDto.extend({
    repliedPostId: idDto.nullable().optional(),
    quotedPostId: idDto.nullable().optional()
});

export const postQueryDto = z.object({
    content: z.string().max(MAX_POST_CONTENT_LENGTH),
    from: z.string(),
    since: z.coerce.date(),
    until: z.coerce.date(),
    repliedPostId: idDto,
    quotedPostId: idDto,
    repliedProfileUsername: z.string(),
    quotedProfileUsername: z.string()
}).partial();

export type PostDto = z.infer<typeof postDto>;
export type CreatePostDto = z.infer<typeof createPostDto>;
export type PostQueryDto = z.infer<typeof postQueryDto>;