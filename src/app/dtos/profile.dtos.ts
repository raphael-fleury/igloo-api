import z from "zod";

export const USERNAME_MAX_LENGTH = 15;
export const DISPLAYNAME_MAX_LENGTH = 50;
export const BIO_MAX_LENGTH = 160;

export const createProfileDto = z.object({
    username: z.string().regex(new RegExp(`^\\w{1,${USERNAME_MAX_LENGTH}}$`)),
    displayName: z.string().max(DISPLAYNAME_MAX_LENGTH),
    bio: z.string().max(BIO_MAX_LENGTH).default(""),
});

export const updateProfileDto = createProfileDto.partial();

export const profileDto = createProfileDto.extend({
    id: z.string(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export type CreateProfileDto = z.infer<typeof createProfileDto>;
export type UpdateProfileDto = z.infer<typeof updateProfileDto>;
export type ProfileDto = z.infer<typeof profileDto>;