import { Repository } from "typeorm";
import { UploadAvatarDto, profileDto, ProfileDto } from "@/app/dtos/profile.dtos";
import { NotFoundError } from "@/app/errors";
import { appDataSource } from "@/database/data-source";
import { Profile } from "@/database/entities/profile";
import { CommandHandler } from "@/app/cqrs";
import { StorageService } from "@/app/services/storage.service";

type UploadAvatarCommand = {
    id: string;
    data: UploadAvatarDto;
}

export class UploadAvatarHandler implements CommandHandler<UploadAvatarCommand, ProfileDto> {
    constructor(
        private readonly profileRepository: Repository<Profile>,
        private readonly storageService: StorageService
    ) { }

    static get default() {
        return new UploadAvatarHandler(
            appDataSource.getRepository(Profile),
            new StorageService({ isPublic: true })
        );
    }

    async handle({ id, data }: UploadAvatarCommand) {
        const profile = await this.profileRepository.findOneBy({ id });
        
        if (!profile) {
            throw new NotFoundError(`Profile with id ${id} not found`);
        }

        // Delete old avatar if exists
        if (profile.avatarPath) {
            await this.storageService.deleteFile(profile.avatarPath);
        }

        // Upload new avatar
        const avatarPath = this.storageService.generateFileUrl('avatars', data.avatar);
        await this.storageService.uploadFile(avatarPath, data.avatar);

        // Update database
        profile.avatarPath = avatarPath;
        const updatedProfile = await this.profileRepository.save(profile);

        return profileDto.parse(updatedProfile);
    }
}
