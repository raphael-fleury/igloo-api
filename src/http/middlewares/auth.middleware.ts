import { Elysia, status } from "elysia";
import { appDataSource } from "@/database/data-source";
import { User } from "@/database/entities/user";
import { Profile } from "@/database/entities/profile";

const user = await appDataSource.getRepository(User)
    .findOneBy({ id: 'b316b948-8f6c-4284-8b38-a68ca4d3dee0'}); //mock

const profile = await appDataSource.getRepository(Profile)
    .findOneBy({ id: '14ae85e0-ec24-4c44-bfc7-1d0ba895f51d'}); //mock

export const authMiddleware = (app: Elysia) => app
    .decorate("user", user!) //mock
    .decorate("profile", profile!) //mock
    .guard({
        beforeHandle({ user }) {
            if (!user)
                return status(401, { message: "User not authenticated" });
        }
    });