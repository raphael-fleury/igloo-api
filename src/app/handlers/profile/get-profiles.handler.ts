import { Repository } from "typeorm";
import { profileDto } from "@/app/dtos/profile.dtos";
import { appDataSource } from "@/database/data-source";
import { Profile } from "@/database/entities/profile";

export class GetProfilesHandler {
    constructor(private readonly profileRepository: Repository<Profile>) { }

    static readonly default = new GetProfilesHandler(appDataSource.getRepository(Profile));

    async handle() {
        const profiles = await this.profileRepository.find();
        return profiles.map(p => profileDto.parse(p));
    }
}
