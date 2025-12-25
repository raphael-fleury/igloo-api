export class PasswordHashService {
    async hash(password: string) {
        return await Bun.password.hash(password, {
            algorithm: "bcrypt",
            cost: 12
        });
    }

    async verify(password: string, hash: string) {
        return await Bun.password.verify(password, hash, "bcrypt");
    }
}