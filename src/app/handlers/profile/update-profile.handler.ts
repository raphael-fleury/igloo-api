import { Repository } from "typeorm";
import { profileDto, ProfileDto, UpdateProfileDto } from "@/app/dtos/profile.dtos";
import { AlreadyExistsError, NotFoundError } from "@/app/errors";
import { appDataSource } from "@/database/data-source";
import { Profile } from "@/database/entities/profile";
import { CommandHandler } from "@/app/cqrs";

type UpdateProfileCommand = {
    id: string;
    data: UpdateProfileDto;
}

export class UpdateProfileHandler implements CommandHandler<UpdateProfileCommand, ProfileDto> {
    constructor(private readonly profileRepository: Repository<Profile>) { }

    static get default() {
        return new UpdateProfileHandler(appDataSource.getRepository(Profile));
    }

    async handle({ id, data }: UpdateProfileCommand) {
        const profile = await this.profileRepository.findOneBy({ id });
        
        if (!profile) {
            throw new NotFoundError(`Profile with id ${id} not found`);
        }

        if (data.username && data.username !== profile.username) {
            const existingProfile = await this.profileRepository.findOne({
                where: { username: data.username }
            });

            if (existingProfile) {
                throw new AlreadyExistsError('Username já está em uso');
            }
        }

        Object.assign(profile, data);
        const updatedProfile = await this.profileRepository.save(profile);

        return profileDto.parse(updatedProfile);
    }
}
