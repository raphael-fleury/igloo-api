import z from "zod";
import { idDto } from "./common.dtos";

export const loginDto = z.object({
    email: z.email(),
    password: z.string()
})

export const tokenPayloadDto = z.object({
    userId: idDto,
    profileId: idDto.optional()
})

export type LoginDto = z.infer<typeof loginDto>;
export type TokenPayloadDto = z.infer<typeof tokenPayloadDto>;