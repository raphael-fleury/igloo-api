import { Repository } from "typeorm";
import { User } from "@/database/entities/user";
import { appDataSource } from "@/database/data-source";
import { NotFoundError } from "@/app/errors";
import { userDto, UserDto } from "@/app/dtos/user.dtos";
import { CommandHandler } from "@/app/cqrs";

type GetUserByIdCommand = {
    id: string;
}

export class GetUserByIdHandler implements CommandHandler<GetUserByIdCommand, UserDto> {
    constructor(private readonly userRepository: Repository<User>) { }

    static get default() {
        return new GetUserByIdHandler(appDataSource.getRepository(User));
    }

    async handle({ id }: GetUserByIdCommand) {
        const user = await this.userRepository.findOneBy({ id });
        
        if (!user) {
            throw new NotFoundError(`User with id ${id} not found`);
        }
        
        return userDto.parse(user);
    }
}