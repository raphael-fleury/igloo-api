import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Repository } from "typeorm";
import { zocker } from "zocker";
import { LoginHandler } from "../login.handler";
import { loginDto } from "@/app/dtos/auth.dtos";
import { User } from "@/database/entities/user";
import { NotFoundError } from "@/app/errors";
import { PasswordHashService } from "@/app/services/password-hash.service";
import { UserProfile } from "@/database/entities/user-profile";

describe("LoginHandler", () => {
    let handler: LoginHandler;
    let mockUserRepository: Repository<User>;
    let mockUserProfileRepository: Repository<UserProfile>;
    let mockHashService: PasswordHashService;

    beforeEach(() => {
        mockUserRepository = {
            findOne: mock(() => Promise.resolve(null)),
        } as any;
        mockUserProfileRepository = {
            findOne: mock(() => Promise.resolve(null)),
        } as any;
        mockHashService = {
            verify: mock(() => Promise.resolve(true)),
        } as any;
        handler = new LoginHandler(mockUserRepository, mockUserProfileRepository, mockHashService);
    });

    it("should return userId and profileId when email and password are valid", async () => {
        // Arrange
        const loginData = zocker(loginDto).generate();
        const mockUser = {
            id: "user-id-1",
            passwordHash: "$2b$10$qV1JmMOCKHASHVALUEqV1JmMOCKHASHVALUE", // not real, we'll mock verify
        } as User;
        const mockUserProfile = {
            id: "rel-id",
            user: mockUser,
            profile: { id: "profile-id-1" }
        } as any;

        mockUserRepository.findOne = mock(() => Promise.resolve(mockUser));
        mockUserProfileRepository.findOne = mock(() => Promise.resolve(mockUserProfile));

        // Act
        const result = await handler.handle(loginData);

        // Assert
        expect(result).toEqual({ userId: "user-id-1", profileId: "profile-id-1" });
        expect(mockHashService.verify).toHaveBeenCalled();
        expect(mockUserRepository.findOne).toHaveBeenCalledWith({
            where: { email: loginData.email },
            select: ["id", "passwordHash"],
        });
        expect(mockUserProfileRepository.findOne).toHaveBeenCalled();
    });

    it("should throw NotFoundError when user does not exist", async () => {
        // Arrange
        const loginData = zocker(loginDto).generate();
        mockUserRepository.findOne = mock(() => Promise.resolve(null));

        // Act & Assert
        expect(handler.handle(loginData)).rejects.toThrow(NotFoundError);
        expect(handler.handle(loginData)).rejects.toThrow("Invalid email or password");
    });

    it("should throw NotFoundError when password is invalid", async () => {
        // Arrange
        const loginData = zocker(loginDto).generate();
        const mockUser = {
            id: "user-id-1",
            passwordHash: "$2b$10$qV1JmMOCKHASHVALUEqV1JmMOCKHASHVALUE",
        } as User;
        
        mockUserRepository.findOne = mock(() => Promise.resolve(mockUser));
        mockHashService.verify = mock(() => Promise.resolve(false));

        // Act & Assert
        expect(handler.handle(loginData)).rejects.toThrow(NotFoundError);
        expect(handler.handle(loginData)).rejects.toThrow("Invalid email or password");
    });
});
