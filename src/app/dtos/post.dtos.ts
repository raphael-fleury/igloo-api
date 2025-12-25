import z from "zod";
import { idDto } from "./common.dtos";

const contentDto = z.string().min(1).max(300);

const basePostDto = z.object({
    content: contentDto
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

export type PostDto = z.infer<typeof postDto>;
export type CreatePostDto = z.infer<typeof createPostDto>;