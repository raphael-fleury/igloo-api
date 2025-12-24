import z from "zod";
import { idDto } from "./common.dtos";

const basePostDto = z.object({
    content: z.string().min(1).max(300)
});

export const postDto = basePostDto.extend({
    id: idDto,
    replyToPostId: idDto.nullable().optional(),
    quoteToPostId: idDto.nullable().optional(),
    createdAt: z.date(),
    updatedAt: z.date()
});

export const createPostDto = basePostDto.extend({
    replyToPostId: idDto.nullable().optional(),
    quoteToPostId: idDto.nullable().optional()
});

export type PostDto = z.infer<typeof postDto>;
export type CreatePostDto = z.infer<typeof createPostDto>;
