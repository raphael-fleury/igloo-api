import { Repository } from "typeorm";
import { appDataSource } from "@/database/data-source";
import { User } from "@/database/entities/user";
import { LoginDto } from "@/app/dtos/auth.dtos";
import { NotFoundError } from "@/app/errors";

export class LoginHandler {
    constructor(private readonly userRepository: Repository<User>) { }

    static get default() {
        return new LoginHandler(appDataSource.getRepository(User));
    }

    async handle(data: LoginDto) {
        const user = await this.userRepository.findOne({
            where: { email: data.email },
            select: ["id", "passwordHash"],
        });

        if (!user) {
            throw new NotFoundError(`Invalid email or password`);
        }

        if (!await Bun.password.verify(data.password, user.passwordHash, "bcrypt")) {
            throw new NotFoundError(`Invalid email or password`);
        }

        return user.id;
    }
}
