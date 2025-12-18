import z from "zod";

export const muteDto = z.object({
    mutedProfileId: z.uuid()
});

export type MuteDto = z.infer<typeof muteDto>;