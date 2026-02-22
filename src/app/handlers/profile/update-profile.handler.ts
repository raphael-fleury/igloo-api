import { Repository } from "typeorm";
import { profileDto, ProfileDto, UpdateProfileDto } from "@/app/dtos/profile.dtos";
import { AlreadyExistsError, NotFoundError } from "@/app/errors";
import { appDataSource } from "@/database/data-source";
import { Profile } from "@/database/entities/profile";
import { CommandHandler } from "@/app/cqrs";
import { StorageService } from "@/app/services/storage.service";

type UpdateProfileCommand = {
    id: string;
    data: UpdateProfileDto;
}

export class UpdateProfileHandler implements CommandHandler<UpdateProfileCommand, ProfileDto> {
    constructor(
        private readonly profileRepository: Repository<Profile>,
        private readonly storageService: StorageService
    ) { }

    static get default() {
        return new UpdateProfileHandler(
            appDataSource.getRepository(Profile),
            new StorageService({ isPublic: true })
        );
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

        let avatarPath = profile.avatarPath;
        const { avatar, ...profileData } = data;

        if (avatar) {
            if (!avatarPath) {
                avatarPath = this.storageService.generateFileUrl('avatars', avatar);
            }
            
            await this.storageService.uploadFile(avatarPath, avatar);
        }

        Object.assign(profile, profileData, { avatarPath });
        const updatedProfile = await this.profileRepository.save(profile);

        return profileDto.parse(updatedProfile);
    }
}
