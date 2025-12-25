import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Repository } from "typeorm";
import { zocker } from "zocker";
import { LoginHandler } from "../login.handler";
import { loginDto } from "@/app/dtos/auth.dtos";
import { User } from "@/database/entities/user";
import { NotFoundError } from "@/app/errors";
import { userDto } from "@/app/dtos/user.dtos";

describe("LoginHandler", () => {
    let handler: LoginHandler;
    let mockRepository: Repository<User>;

    beforeEach(() => {
        mockRepository = {
            findOne: mock(() => Promise.resolve(null)),
        } as any;
        handler = new LoginHandler(mockRepository);
    });

    it("should return user when email and password are valid", async () => {
        // Arrange
        const loginData = zocker(loginDto).generate();
        const expectedUser = {
            ...zocker(userDto).generate(),
            email: loginData.email,
        };

        const mockUser = {
            ...expectedUser,
            passwordHash: loginData.password,
        } as User;

        mockRepository.findOne = mock(() => Promise.resolve(mockUser));

        // Act
        const result = await handler.handle(loginData);

        // Assert
        expect(result).toEqual(expectedUser);
        expect(result).not.toHaveProperty("passwordHash");
        expect(mockRepository.findOne).toHaveBeenCalled;
    });

    it("should throw NotFoundError when user does not exist", async () => {
        // Arrange
        const loginData = zocker(loginDto).generate();
        mockRepository.findOne = mock(() => Promise.resolve(null));

        // Act & Assert
        expect(handler.handle(loginData)).rejects.toThrow(NotFoundError);
        expect(handler.handle(loginData)).rejects.toThrow("Invalid email or password");
    });
});
