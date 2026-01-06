import z from "zod";
import { idDto } from "./common.dtos";

export const sourceProfileDto = z.object({
    sourceProfileId: idDto
});

export const targetProfileDto = z.object({
    targetProfileId: idDto
});

export const postInteractionDto = sourceProfileDto.extend(targetProfileDto.shape);

export type SourceProfileDto = z.infer<typeof sourceProfileDto>;
export type TargetProfileDto = z.infer<typeof targetProfileDto>;
export type PostInteractionDto = z.infer<typeof postInteractionDto>;
