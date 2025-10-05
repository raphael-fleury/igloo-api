import Elysia from "elysia";
import { appDataSource } from "../database/data-source";
import { User } from "../database/entities/user";
import { Profile } from "../database/entities/profile";
import { createUserDto, updateUserDto, userDto } from "../dtos/user.dtos";
import { profileDto } from "../dtos/profile.dtos";

export const userController = new Elysia({ prefix: "/users" })
    .decorate("repository", appDataSource.getRepository(User))
    .get('/', async ({ repository }) => {
        return (await repository.find()).map(u => userDto.parse(u));
    })
    .get('/:id', async ({ repository, params, set }) => {
        const user = await repository.findOne({
            where: { id: params.id }
        });

        if (!user) {
            set.status = 404;
            return { error: 'User not found' };
        }

        return userDto.parse(user);
    })
    .post('/', async ({ body, set }) => {
        return await appDataSource.transaction(async (transactionalEntityManager) => {
            try {
                const user = transactionalEntityManager.create(User, {
                    email: body.email,
                    phone: body.phone,
                    passwordHash: body.password // TODO: Encrypt password
                });
                const savedUser = await transactionalEntityManager.save(user);

                const profile = transactionalEntityManager.create(Profile, {
                    username: body.profile.username,
                    displayName: body.profile.displayName,
                    bio: body.profile.bio,
                    userId: savedUser.id
                });
                const savedProfile = await transactionalEntityManager.save(profile);

                set.status = 201;
                return {
                    ...userDto.parse(savedUser),
                    profile: profileDto.parse(savedProfile)
                };

            } catch (error) {
                console.error('Error on transaction:', error);
                set.status = 500;
                throw new Error('Error creating user and profile');
            }
        });
    }, {
        body: createUserDto
    })
    .patch('/:id', async ({ repository, params, body, set }) => {
        try {
            const user = await repository.findOne({
                where: { id: params.id }
            });
            
            if (!user) {
                set.status = 404;
                return { error: 'User not found' };
            }
            
            if (body.email && body.email !== user.email) {
                const existingUser = await repository.findOne({
                    where: { email: body.email }
                });
                
                if (existingUser) {
                    set.status = 409;
                    return { error: 'Email already in use' };
                }
            }
            
            if (body.phone && body.phone !== user.phone) {
                const existingUser = await repository.findOne({
                    where: { phone: body.phone }
                });
                
                if (existingUser) {
                    set.status = 409;
                    return { error: 'Phone number already in use' };
                }
            }
            
            Object.assign(user, body);
            const updatedUser = await repository.save(user);

            return userDto.parse(updatedUser);

        } catch (error) {
            console.error('Error on updating user:', error);
            set.status = 500;
            return { error: 'Internal server error' };
        }
    }, {
        body: updateUserDto
    });