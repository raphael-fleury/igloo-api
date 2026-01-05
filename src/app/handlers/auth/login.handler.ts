import { Repository } from "typeorm";
import { appDataSource } from "@/database/data-source";
import { User } from "@/database/entities/user";
import { UserProfile } from "@/database/entities/user-profile";
import { LoginDto } from "@/app/dtos/auth.dtos";
import { NotFoundError } from "@/app/errors";
import { PasswordHashService } from "@/app/services/password-hash.service";
import { CommandHandler } from "@/app/cqrs";

export class LoginHandler implements CommandHandler<LoginDto, { userId: string; profileId: string }> {
    constructor(
        private readonly userRepository: Repository<User>,
        private readonly userProfileRepository: Repository<UserProfile>,
        private readonly passwordHashService: PasswordHashService
    ) { }

    static get default() {
        return new LoginHandler(
            appDataSource.getRepository(User),
            appDataSource.getRepository(UserProfile),
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

        const userProfile = await this.userProfileRepository.findOne({
            where: { user },
            relations: { profile: true }
        });

        return {
            userId: user.id,
            profileId: userProfile!.profile.id as string
        };
    }
}
