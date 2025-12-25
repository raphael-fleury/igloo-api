import { Elysia, t } from "elysia";
import { jwt } from '@elysiajs/jwt'
import { env } from "@/env";

export const jwtMiddleware = (app: Elysia) => app
    .use(
        jwt({
            name: 'jwt',
            secret: env.JWT_SECRET,
            schema: t.Object({
                userId: t.String(),
                profileId: t.Optional(t.String())
            })
        })
    );