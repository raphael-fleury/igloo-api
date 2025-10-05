import z from "zod";
import { createProfileDto } from "./profile.dtos";

const phoneRegex = new RegExp(
  '^\\+(9[976]\\d|8[987530]\\d|6[987]\\d|5[90]\\d|42\\d|3[875]\\d|' +
  '2[98654321]\\d|9[8543210]|8[6421]|6[6543210]|5[87654321]|' +
  '4[987654310]|3[9643210]|2[70]|7|1)\\d{1,14}$'
);

const baseUserDto = z.object({
    phone: z.string().regex(phoneRegex),
    email: z.email()
});

export const userDto = baseUserDto.extend({
    id: z.uuid(),
    isActive: z.boolean(),
    createdAt: z.date(),
    updatedAt: z.date()
});

export const createUserDto = baseUserDto.extend({
    password: z.string().min(8),
    profile: createProfileDto
})

export const updateUserDto = baseUserDto.partial();

export type UserDto = z.infer<typeof userDto>;
export type CreateUserDto = z.infer<typeof createUserDto>;
export type UpdateUserDto = z.infer<typeof updateUserDto>;
