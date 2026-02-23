import { Repository } from "typeorm";
import { NotFoundError } from "@/app/errors";
import { appDataSource } from "@/database/data-source";
import { Profile } from "@/database/entities/profile";
import { CommandHandler } from "@/app/cqrs";
import { StorageService } from "@/app/services/storage.service";

type DeleteHeaderCommand = {
    id: string;
}

export class DeleteHeaderHandler implements CommandHandler<DeleteHeaderCommand, void> {
    constructor(
        private readonly profileRepository: Repository<Profile>,
        private readonly storageService: StorageService
    ) { }

    static get default() {
        return new DeleteHeaderHandler(
            appDataSource.getRepository(Profile),
            new StorageService({ isPublic: true })
        );
    }

    async handle({ id }: DeleteHeaderCommand) {
        const profile = await this.profileRepository.findOneBy({ id });
        
        if (!profile) {
            throw new NotFoundError(`Profile with id ${id} not found`);
        }

        if (profile.headerPath) {
            await this.storageService.deleteFile(profile.headerPath);
            profile.headerPath = undefined;
            await this.profileRepository.save(profile);
        }
    }
}
