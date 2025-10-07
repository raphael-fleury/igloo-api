import { UpdateUserDto, userDto } from "@/app/dtos/user.dtos";
import { User } from "@/database/entities/user";
import { AlreadyExistsError, NotFoundError } from "@/app/errors";
import { Repository } from "typeorm";

export class UpdateUserHandler {
    constructor(private readonly userRepository: Repository<User>) { }

    async handle(id: string, data: UpdateUserDto) {
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