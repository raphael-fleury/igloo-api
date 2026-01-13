import z from "zod";
import { dateDto, idDto, pageDto } from "./common.dtos";

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 15;
export const DISPLAYNAME_MAX_LENGTH = 50;
export const BIO_MAX_LENGTH = 160;

const usernameRegex = new RegExp(String.raw`^\w{${USERNAME_MIN_LENGTH},${USERNAME_MAX_LENGTH}}$`);

export const createProfileDto = z.object({
    username: z.string().regex(usernameRegex),
    displayName: z.string().max(DISPLAYNAME_MAX_LENGTH),
    bio: z.string().max(BIO_MAX_LENGTH).default(""),
});

export const updateProfileDto = createProfileDto.partial();

export const profileDto = createProfileDto.extend({
    id: idDto,
    createdAt: dateDto,
    updatedAt: dateDto,
});

export const detailedProfileDto = profileDto.extend({
    blocksMe: z.boolean(),
    blocked: z.boolean(),
    followsMe: z.boolean(),
    followed: z.boolean(),
    muted: z.boolean()
})

export const blockedProfilesDto = pageDto.extend({
    items: z.array(profileDto.extend({
        blockedAt: dateDto
    }))
});

export const followsDto = pageDto.extend({
    items: z.array(profileDto.extend({
        followedAt: dateDto
    }))
});

export const mutedProfilesDto = pageDto.extend({
    items: z.array(profileDto.extend({
        mutedAt: dateDto
    }))
});

export const likesDto = pageDto.extend({
    items: z.array(profileDto.extend({
        likedAt: dateDto
    }))
});

export const repostsDto = pageDto.extend({
    items: z.array(profileDto.extend({
        repostedAt: dateDto
    }))
});

export const profilesPageDto = pageDto.extend({
    items: z.array(profileDto),
});

export type CreateProfileDto = z.infer<typeof createProfileDto>;
export type UpdateProfileDto = z.infer<typeof updateProfileDto>;
export type ProfileDto = z.infer<typeof profileDto>;
export type DetailedProfileDto = z.infer<typeof detailedProfileDto>;
export type BlockedProfilesDto = z.infer<typeof blockedProfilesDto>;
export type FollowsDto = z.infer<typeof followsDto>;
export type MutedProfilesDto = z.infer<typeof mutedProfilesDto>;
export type LikesDto = z.infer<typeof likesDto>;
export type RepostsDto = z.infer<typeof repostsDto>;
export type ProfilesPageDto = z.infer<typeof profilesPageDto>;
