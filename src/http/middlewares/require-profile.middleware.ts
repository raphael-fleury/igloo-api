import Elysia from "elysia";
import { authMiddleware } from "./auth.middleware";

export const requireProfileMiddleware = (app: Elysia) => app
    .use(authMiddleware)
    .onBeforeHandle(({ profile, status }) => {
        if (!profile) {
            return status(403, { message: "Profile not selected" });
        }
    })
    .derive(({ profile }) => ({
        profile: profile!
    }));