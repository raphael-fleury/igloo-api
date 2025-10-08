import { profileDto } from "@/app/dtos/profile.dtos";
import { Profile } from "@/database/entities/profile";
import { Repository } from "typeorm";

export class GetProfilesHandler {
    constructor(private readonly profileRepository: Repository<Profile>) { }

    async handle() {
        const profiles = await this.profileRepository.find();
        return profiles.map(p => profileDto.parse(p));
    }
}
