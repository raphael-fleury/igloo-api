import { userDto } from "@/app/dtos/user.dtos";
import { User } from "@/database/entities/user";
import { NotFoundError } from "@/app/errors";
import { Repository } from "typeorm";

export class GetUserByIdHandler {
    constructor(private readonly userRepository: Repository<User>) { }

    async handle(id: string) {
        const user = await this.userRepository.findOneBy({ id });
        
        if (!user) {
            throw new NotFoundError(`User with id ${id} not found`);
        }
        
        return userDto.parse(user);
    }
}