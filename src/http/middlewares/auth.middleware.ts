import { Elysia } from "elysia";
import { appDataSource } from "@/database/data-source";
import { User } from "@/database/entities/user";
import { Profile } from "@/database/entities/profile";

const user = await appDataSource.getRepository(User).findOneBy({ id: '982c1ace-fa83-4922-8887-798ada44d8d7'}); //mock
const profile = await appDataSource.getRepository(Profile).findOneBy({ id: '866a026c-44b8-48ff-bd37-3dfd7c460171'}); //mock

export const authMiddleware = (app: Elysia) => app
    .decorate("user", user!) //mock
    .decorate("profile", profile!); //mock