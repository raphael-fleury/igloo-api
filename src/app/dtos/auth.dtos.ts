import z from "zod";
import { idDto } from "./common.dtos";
import { userDto } from "./user.dtos";
import { profileDto } from "./profile.dtos";

export const loginDto = z.object({
    email: z.email(),
    password: z.string()
})

export const tokenPayloadDto = z.object({
    userId: idDto,
    profileId: idDto.optional()
})

export const authInfoDto = z.object({
    user: userDto,
    profile: profileDto.optional()
})

export type LoginDto = z.infer<typeof loginDto>;
export type TokenPayloadDto = z.infer<typeof tokenPayloadDto>;
export type AuthInfoDto = z.infer<typeof authInfoDto>;