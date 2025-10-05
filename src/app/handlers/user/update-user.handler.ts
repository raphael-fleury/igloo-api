import { UpdateUserDto, userDto } from "@/app/dtos/user.dtos";
import { User } from "@/database/entities/user";
import { Repository } from "typeorm";

export class UpdateUserHandler {
    constructor(private readonly userRepository: Repository<User>) { }

    async handle(id: string, data: UpdateUserDto) {
        const user = await this.userRepository.findOneBy({ id });

        if (!user) {
            return null;
        }

        if (data.email && data.email !== user.email) {
            const existingUser = await this.userRepository.findOne({
                where: { email: data.email }
            });

            if (existingUser) {
                return { error: 'Email already in use' };
            }
        }

        if (data.phone && data.phone !== user.phone) {
            const existingUser = await this.userRepository.findOne({
                where: { phone: data.phone }
            });

            if (existingUser) {
                return { error: 'Phone number already in use' };
            }
        }

        Object.assign(user, data);
        const updatedUser = await this.userRepository.save(user);

        return userDto.parse(updatedUser);
    }
}