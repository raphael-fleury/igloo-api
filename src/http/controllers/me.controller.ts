import Elysia from "elysia";
import { onErrorMiddleware } from "../middlewares/on-error.middleware";
import { authMiddleware } from "../middlewares/auth.middleware";
import { appDataSource } from "@/database/data-source";
import { userDto } from "@/app/dtos/user.dtos";
import { profileDto } from "@/app/dtos/profile.dtos";

export const meController = (
    userProfileRepository = appDataSource.getRepository("UserProfile")
) => new Elysia({ prefix: "/me" })
    .use(onErrorMiddleware)
    .use(authMiddleware)
    .guard({ detail: { tags: ['Me'] } })

    .get('/', ({ user }) => {
        return userDto.parse(user);
    }, {
        detail: { summary: "Get current authenticated user" }
    })

    .get('/profiles', async ({ user }) => {
        const userProfiles = await userProfileRepository.find({
            where: { user: { id: user.id } },
            relations: ['profile']
        });

        return userProfiles.map(up => profileDto.parse(up.profile));
    }, {
        detail: { summary: "Get profiles of current authenticated user" }
    })

    .get('/profiles/active', ({ profile }) => profileDto.parse(profile), {
        detail: { summary: "Get active profile of current authenticated user" }
    });