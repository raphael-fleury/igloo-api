import Elysia from "elysia";
import { appDataSource } from "../database/data-source";
import { Profile } from "../database/entities/profile";
import { profileDto, updateProfileDto } from "../dtos/profile.dtos";

export const profileController = new Elysia({ prefix: "/profiles" })
    .decorate("profileRepository", appDataSource.getRepository(Profile))
    .get('/', async ({ profileRepository }) => {
        return (await profileRepository.find()).map(p => profileDto.parse(p));
    })
    .get('/:id', async ({ profileRepository, params, set }) => {
        const profile = await profileRepository.findOne({
            where: { id: params.id }
        });
        
        if (!profile) {
            set.status = 404;
            return { error: 'Profile not found' };
        }

        return profileDto.parse(profile);
    })
    .patch('/:id', async ({ profileRepository, params, body, set }) => {
        try {
            const profile = await profileRepository.findOne({
                where: { id: params.id }
            });
            
            if (!profile) {
                set.status = 404;
                return { error: 'Profile not found' };
            }

            if (body.username && body.username !== profile.username) {
                const existingProfile = await profileRepository.findOne({
                    where: { username: body.username }
                });
                
                if (existingProfile) {
                    set.status = 409;
                    return { error: 'Username já está em uso' };
                }
            }
            
            Object.assign(profile, body);
            const updatedProfile = await profileRepository.save(profile);
            
            return profileDto.parse(updatedProfile);
            
        } catch (error) {
            console.error('Error on updating profile:', error);
            set.status = 500;
            return { error: 'Internal server error' };
        }
    }, {
        body: updateProfileDto
    });