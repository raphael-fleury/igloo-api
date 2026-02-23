import { Repository } from "typeorm";
import { UploadHeaderDto, profileDto, ProfileDto } from "@/app/dtos/profile.dtos";
import { NotFoundError } from "@/app/errors";
import { appDataSource } from "@/database/data-source";
import { Profile } from "@/database/entities/profile";
import { CommandHandler } from "@/app/cqrs";
import { StorageService } from "@/app/services/storage.service";

type UploadHeaderCommand = {
    id: string;
    data: UploadHeaderDto;
}

export class UploadHeaderHandler implements CommandHandler<UploadHeaderCommand, ProfileDto> {
    constructor(
        private readonly profileRepository: Repository<Profile>,
        private readonly storageService: StorageService
    ) { }

    static get default() {
        return new UploadHeaderHandler(
            appDataSource.getRepository(Profile),
            new StorageService({ isPublic: true })
        );
    }

    async handle({ id, data }: UploadHeaderCommand) {
        const profile = await this.profileRepository.findOneBy({ id });
        
        if (!profile) {
            throw new NotFoundError(`Profile with id ${id} not found`);
        }

        // Delete old header if exists
        if (profile.headerPath) {
            await this.storageService.deleteFile(profile.headerPath);
        }

        // Upload new header
        const headerPath = this.storageService.generateFileUrl('headers', data.header);
        await this.storageService.uploadFile(headerPath, data.header);

        // Update database
        profile.headerPath = headerPath;
        const updatedProfile = await this.profileRepository.save(profile);

        return profileDto.parse(updatedProfile);
    }
}
