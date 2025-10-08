import { profileDto } from "@/app/dtos/profile.dtos";
import { NotFoundError } from "@/app/errors";
import { Profile } from "@/database/entities/profile";
import { Repository } from "typeorm";

export class GetProfileByIdHandler {
    constructor(private readonly profileRepository: Repository<Profile>) { }

    async handle(id: string) {
        const profile = await this.profileRepository.findOneBy({ id });
        
        if (!profile) {
            throw new NotFoundError(`Profile with id ${id} not found`);
        }

        return profileDto.parse(profile);
    }
}
