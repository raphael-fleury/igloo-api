import z from "zod";
import { idDto } from "./common.dtos";

export const blockDto = z.object({
    blockedProfileId: idDto
});

export const blockCheckDto = z.object({
    blockerProfileId: idDto
});

export type BlockDto = z.infer<typeof blockDto>;
export type BlockCheckDto = z.infer<typeof blockCheckDto>;