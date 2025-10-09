import { Repository } from "typeorm";
import { profileDto } from "@/app/dtos/profile.dtos";
import { NotFoundError } from "@/app/errors";
import { appDataSource } from "@/database/data-source";
import { Profile } from "@/database/entities/profile";

export class GetProfileByIdHandler {
    constructor(private readonly profileRepository: Repository<Profile>) { }

    static readonly default = new GetProfileByIdHandler(appDataSource.getRepository(Profile));

    async handle(id: string) {
        const profile = await this.profileRepository.findOneBy({ id });
        
        if (!profile) {
            throw new NotFoundError(`Profile with id ${id} not found`);
        }

        return profileDto.parse(profile);
    }
}
