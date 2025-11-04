import { Repository } from "typeorm";
import { userDto } from "@/app/dtos/user.dtos";
import { appDataSource } from "@/database/data-source";
import { User } from "@/database/entities/user";

export class GetUsersHandler {
    constructor(private readonly userRepository: Repository<User>) { }

    static readonly default = new GetUsersHandler(appDataSource.getRepository(User));

    async handle() {
        const users = await this.userRepository.find({
            relations: ['userProfiles', 'userProfiles.profile']
        });
        return users.map(u => userDto.parse(u));
    }
}