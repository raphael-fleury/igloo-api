import { Repository } from "typeorm";
import { appDataSource } from "@/database/data-source";
import { User } from "@/database/entities/user";
import { LoginDto } from "@/app/dtos/auth.dtos";
import { NotFoundError } from "@/app/errors";
import { PasswordHashService } from "@/app/services/password-hash.service";

export class LoginHandler {
    constructor(
        private readonly userRepository: Repository<User>,
        private readonly passwordHashService: PasswordHashService
    ) { }

    static get default() {
        return new LoginHandler(
            appDataSource.getRepository(User),
            new PasswordHashService()
        );
    }

    async handle(data: LoginDto) {
        const user = await this.userRepository.findOne({
            where: { email: data.email },
            select: ["id", "passwordHash"],
        });

        if (!user) {
            throw new NotFoundError(`Invalid email or password`);
        }

        if (!await this.passwordHashService.verify(data.password, user.passwordHash)) {
            throw new NotFoundError(`Invalid email or password`);
        }

        return user.id;
    }
}
