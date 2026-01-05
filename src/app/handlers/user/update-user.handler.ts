import { Repository } from "typeorm";
import { UpdateUserDto, userDto, UserDto } from "@/app/dtos/user.dtos";
import { AlreadyExistsError, NotFoundError } from "@/app/errors";
import { User } from "@/database/entities/user";
import { appDataSource } from "@/database/data-source";
import { CommandHandler } from "@/app/cqrs";

type UpdateUserCommand = {
    id: string;
    data: UpdateUserDto;
}

export class UpdateUserHandler implements CommandHandler<UpdateUserCommand, UserDto> {
    constructor(private readonly userRepository: Repository<User>) { }

    static get default() {
        return new UpdateUserHandler(appDataSource.getRepository(User));
    }

    async handle({ id, data }: UpdateUserCommand) {
        const user = await this.userRepository.findOneBy({ id });
        
        if (!user) {
            throw new NotFoundError(`User with id ${id} not found`);
        }

        if (data.email && data.email !== user.email) {
            const existingUser = await this.userRepository.findOne({
                where: { email: data.email }
            });

            if (existingUser) {
                throw new AlreadyExistsError(`Email ${data.email} already exists`);
            }
        }

        if (data.phone && data.phone !== user.phone) {
            const existingUser = await this.userRepository.findOne({
                where: { phone: data.phone }
            });

            if (existingUser) {
                throw new AlreadyExistsError(`Phone number ${data.phone} already exists`);
            }
        }

        Object.assign(user, data);
        const updatedUser = await this.userRepository.save(user);

        return userDto.parse(updatedUser);
    }
}