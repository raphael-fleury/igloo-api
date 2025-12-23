import z from "zod";

const basePostDto = z.object({
    content: z.string().min(1).max(300)
});

export const postDto = basePostDto.extend({
    id: z.uuid(),
    userId: z.uuid(),
    profileId: z.uuid(),
    replyToPostId: z.uuid().nullable().optional(),
    quoteToPostId: z.uuid().nullable().optional(),
    createdAt: z.date(),
    updatedAt: z.date()
});

export const createPostDto = basePostDto.extend({
    replyToPostId: z.uuid().nullable().optional(),
    quoteToPostId: z.uuid().nullable().optional()
});

export type PostDto = z.infer<typeof postDto>;
export type CreatePostDto = z.infer<typeof createPostDto>;
