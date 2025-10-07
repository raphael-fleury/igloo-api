import z from "zod";
import Elysia from "elysia";
import { appDataSource } from "@/database/data-source";
import { Profile } from "@/database/entities/profile";
import { profileDto, updateProfileDto } from "@/app/dtos/profile.dtos";
import { NotFoundError, AlreadyExistsError } from "@/app/errors";

export const profileController = new Elysia({ prefix: "/profiles" })
    .decorate("profileRepository", appDataSource.getRepository(Profile))
    .get('/', async ({ profileRepository }) => {
        return (await profileRepository.find()).map(p => profileDto.parse(p));
    })
    .get('/:id', async ({ profileRepository, params }) => {
        const profile = await profileRepository.findOne({
            where: { id: params.id }
        });

        if (!profile) {
            throw new NotFoundError(`Profile with id ${params.id} not found`);
        }

        return profileDto.parse(profile);
    }, {
        params: z.object({
            id: z.uuid()
        })
    })
    .patch('/:id', async ({ profileRepository, params, body }) => {
        const profile = await profileRepository.findOne({
            where: { id: params.id }
        });

        if (!profile) {
            throw new NotFoundError(`Profile with id ${params.id} not found`);
        }

        if (body.username && body.username !== profile.username) {
            const existingProfile = await profileRepository.findOne({
                where: { username: body.username }
            });

            if (existingProfile) {
                throw new AlreadyExistsError('Username já está em uso');
            }
        }

        Object.assign(profile, body);
        const updatedProfile = await profileRepository.save(profile);

        return profileDto.parse(updatedProfile);
    }, {
        params: z.object({
            id: z.uuid()
        }),
        body: updateProfileDto
    });