import z from "zod";
import { idDto } from "./common.dtos";

export const followDto = z.object({
    followedProfileId: idDto
});

export type FollowDto = z.infer<typeof followDto>;
