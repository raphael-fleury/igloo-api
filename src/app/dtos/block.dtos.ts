import z from "zod";

export const blockDto = z.object({
    blockedProfileId: z.uuid()
});

export const blockCheckDto = z.object({
    blockerProfileId: z.uuid()
});

export type BlockDto = z.infer<typeof blockDto>;
export type BlockCheckDto = z.infer<typeof blockCheckDto>;