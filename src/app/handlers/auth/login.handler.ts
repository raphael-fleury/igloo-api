import { Repository } from "typeorm";
import { appDataSource } from "@/database/data-source";
import { User } from "@/database/entities/user";
import { LoginDto } from "@/app/dtos/auth.dtos";
import { NotFoundError } from "@/app/errors";
import { userDto } from "@/app/dtos/user.dtos";

export class LoginHandler {
    constructor(private readonly userRepository: Repository<User>) { }

    static get default() {
        return new LoginHandler(appDataSource.getRepository(User));
    }

    async handle(data: LoginDto) {
        const hashedPassword = data.password; //TODO: Hash

        const user = await this.userRepository.findOne({
            where: {
                email: data.email,
                passwordHash: hashedPassword
            }
        });

        if (!user) {
            throw new NotFoundError(`Invalid email or password`);
        }

        return userDto.parse(user);
    }
}
