import { userDto } from "@/app/dtos/user.dtos";
import { User } from "@/database/entities/user";
import { Repository } from "typeorm";

export class GetUserByIdHandler {
    constructor(private readonly userRepository: Repository<User>) { }

    async handle(id: string) {
        const user = await this.userRepository.findOneBy({ id });
        return user ? userDto.parse(user) : null;
    }
}