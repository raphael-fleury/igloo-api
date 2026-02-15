import z from "zod";
import { dateDto, idDto } from "./common.dtos";
import { createProfileDto } from "./profile.dtos";

const baseUserDto = z.object({
    phone: z.e164(),
    email: z.email()
});

export const userDto = baseUserDto.extend({
    id: idDto,
    createdAt: dateDto
});

export const createUserDto = baseUserDto.extend({
    password: z.string().min(8),
    profile: createProfileDto
})

export const updateUserDto = baseUserDto.partial();

export type UserDto = z.infer<typeof userDto>;
export type CreateUserDto = z.infer<typeof createUserDto>;
export type UpdateUserDto = z.infer<typeof updateUserDto>;
