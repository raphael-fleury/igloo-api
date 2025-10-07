import { userDto } from "@/app/dtos/user.dtos";
import { User } from "@/database/entities/user";
import { Repository } from "typeorm";

export class GetUsersHandler {
    constructor(private readonly userRepository: Repository<User>) { }

    async handle() {
        const users = await this.userRepository.find();
        return users.map(u => userDto.parse(u));
    }
}