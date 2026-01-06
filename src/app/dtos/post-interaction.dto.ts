import z from "zod";
import { idDto, pageQueryDto } from "./common.dtos";

export const sourceProfileDto = pageQueryDto.extend({
    sourceProfileId: idDto
});

export const targetProfileDto = pageQueryDto.extend({
    targetProfileId: idDto
});

export const postInteractionDto = sourceProfileDto.extend(targetProfileDto.shape);

export type SourceProfileDto = z.infer<typeof sourceProfileDto>;
export type TargetProfileDto = z.infer<typeof targetProfileDto>;
export type PostInteractionDto = z.infer<typeof postInteractionDto>;
