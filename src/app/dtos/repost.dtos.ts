import z from "zod";
import { idDto } from "./common.dtos";

export const repostDto = z.object({
    postId: idDto
});

export type RepostDto = z.infer<typeof repostDto>;

