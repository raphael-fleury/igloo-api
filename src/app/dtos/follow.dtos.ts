import z from "zod";

export const followDto = z.object({
    followedProfileId: z.uuid()
});

export type FollowDto = z.infer<typeof followDto>;
