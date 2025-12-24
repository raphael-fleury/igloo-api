import z from "zod";
import { idDto } from "./common.dtos";

export const likeDto = z.object({
    postId: idDto
});

export type LikeDto = z.infer<typeof likeDto>;
