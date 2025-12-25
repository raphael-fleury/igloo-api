import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Repository } from "typeorm";
import { zocker } from "zocker";
import { LoginHandler } from "../login.handler";
import { loginDto } from "@/app/dtos/auth.dtos";
import { User } from "@/database/entities/user";
import { NotFoundError } from "@/app/errors";
import { idDto } from "@/app/dtos/common.dtos";
import { PasswordHashService } from "@/app/services/password-hash.service";

describe("LoginHandler", () => {
    let handler: LoginHandler;
    let mockRepository: Repository<User>;
    let mockHashService: PasswordHashService;

    beforeEach(() => {
        mockRepository = {
            findOne: mock(() => Promise.resolve(null)),
        } as any;
        mockHashService = {
            verify: mock(() => Promise.resolve(true)),
        } as any;
        handler = new LoginHandler(mockRepository, mockHashService);
    });

    it("should return user id when email and password are valid", async () => {
        // Arrange
        const loginData = zocker(loginDto).generate();
        const mockUser = {
            id: zocker(idDto).generate(),
            passwordHash: "$2b$10$qV1JmMOCKHASHVALUEqV1JmMOCKHASHVALUE", // not real, we'll mock verify
        } as User;

        mockRepository.findOne = mock(() => Promise.resolve(mockUser));

        // Act
        const result = await handler.handle(loginData);

        // Assert
        expect(result).toEqual(mockUser.id);
        expect(mockHashService.verify).toHaveBeenCalled();
        expect(mockRepository.findOne).toHaveBeenCalledWith({
            where: { email: loginData.email },
            select: ["id", "passwordHash"],
        });
    });

    it("should throw NotFoundError when user does not exist", async () => {
        // Arrange
        const loginData = zocker(loginDto).generate();
        mockRepository.findOne = mock(() => Promise.resolve(null));

        // Act & Assert
        expect(handler.handle(loginData)).rejects.toThrow(NotFoundError);
        expect(handler.handle(loginData)).rejects.toThrow("Invalid email or password");
    });

    it("should throw NotFoundError when password is invalid", async () => {
        // Arrange
        const loginData = zocker(loginDto).generate();
        const mockUser = {
            id: zocker(idDto).generate(),
            passwordHash: "$2b$10$qV1JmMOCKHASHVALUEqV1JmMOCKHASHVALUE",
        } as User;
        
        mockRepository.findOne = mock(() => Promise.resolve(mockUser));
        mockHashService.verify = mock(() => Promise.resolve(false));

        // Act & Assert
        expect(handler.handle(loginData)).rejects.toThrow(NotFoundError);
        expect(handler.handle(loginData)).rejects.toThrow("Invalid email or password");
    });
});
