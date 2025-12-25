import { Elysia, status } from "elysia";
import { GetAuthInfoHandler } from "@/app/handlers/auth/get-auth-info.handler";
import { jwtMiddleware } from "./jwt.middleware";

export function buildAuthMiddleware(
    getAuthInfoHandler = GetAuthInfoHandler.default
) {
    return (app: Elysia) => app
        .use(jwtMiddleware)
        .derive(async ({ headers }) => {
            const token = headers.authorization?.replace('Bearer ', '');
            return { token };
        })
        .onBeforeHandle(async ({ token }) => {
            if (!token || token === 'null')
                return status(401, { message: "No token provided" });
        })
        .derive(async ({ jwt, token }) => {
            const payload = await jwt.verify(token);
            if (!payload)
                return status(401, { message: "Invalid token" });

            return await getAuthInfoHandler.handle(payload);
        })
}

export const authMiddleware = buildAuthMiddleware();