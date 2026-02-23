import { Repository } from "typeorm";
import { NotFoundError } from "@/app/errors";
import { appDataSource } from "@/database/data-source";
import { Profile } from "@/database/entities/profile";
import { CommandHandler } from "@/app/cqrs";
import { StorageService } from "@/app/services/storage.service";

type DeleteAvatarCommand = {
    id: string;
}

export class DeleteAvatarHandler implements CommandHandler<DeleteAvatarCommand, void> {
    constructor(
        private readonly profileRepository: Repository<Profile>,
        private readonly storageService: StorageService
    ) { }

    static get default() {
        return new DeleteAvatarHandler(
            appDataSource.getRepository(Profile),
            new StorageService({ isPublic: true })
        );
    }

    async handle({ id }: DeleteAvatarCommand) {
        const profile = await this.profileRepository.findOneBy({ id });
        
        if (!profile) {
            throw new NotFoundError(`Profile with id ${id} not found`);
        }

        if (profile.avatarPath) {
            await this.storageService.deleteFile(profile.avatarPath);
            profile.avatarPath = undefined;
            await this.profileRepository.save(profile);
        }
    }
}
