import z from "zod";

export const repostDto = z.object({
    postId: z.uuid()
});

export type RepostDto = z.infer<typeof repostDto>;

