import z from "zod";
import { idDto } from "./common.dtos";

export const muteDto = z.object({
    mutedProfileId: idDto
});

export type MuteDto = z.infer<typeof muteDto>;