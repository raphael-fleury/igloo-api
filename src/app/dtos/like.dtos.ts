import z from "zod";

export const likeDto = z.object({
    postId: z.uuid()
});

export type LikeDto = z.infer<typeof likeDto>;
