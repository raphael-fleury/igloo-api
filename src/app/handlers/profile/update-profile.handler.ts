import { Repository } from "typeorm";
import { profileDto, UpdateProfileDto } from "@/app/dtos/profile.dtos";
import { AlreadyExistsError, NotFoundError } from "@/app/errors";
import { appDataSource } from "@/database/data-source";
import { Profile } from "@/database/entities/profile";

export class UpdateProfileHandler {
    constructor(private readonly profileRepository: Repository<Profile>) { }

    static get default() {
        return new UpdateProfileHandler(appDataSource.getRepository(Profile));
    }

    async handle(id: string, updateData: UpdateProfileDto) {
        const profile = await this.profileRepository.findOneBy({ id });
        
        if (!profile) {
            throw new NotFoundError(`Profile with id ${id} not found`);
        }

        if (updateData.username && updateData.username !== profile.username) {
            const existingProfile = await this.profileRepository.findOne({
                where: { username: updateData.username }
            });

            if (existingProfile) {
                throw new AlreadyExistsError('Username já está em uso');
            }
        }

        Object.assign(profile, updateData);
        const updatedProfile = await this.profileRepository.save(profile);

        return profileDto.parse(updatedProfile);
    }
}
