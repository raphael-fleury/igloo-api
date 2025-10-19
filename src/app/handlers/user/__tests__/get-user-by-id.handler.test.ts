import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Repository } from "typeorm";
import { zocker } from "zocker";
import { GetUserByIdHandler } from "../get-user-by-id.handler";
import { User } from "@/database/entities/user";
import { NotFoundError } from "@/app/errors";
import { userDto } from "@/app/dtos/user.dtos";

describe("GetUserByIdHandler", () => {
    let handler: GetUserByIdHandler;
    let mockRepository: Repository<User>;

    beforeEach(() => {
        mockRepository = {
            findOne: mock(() => Promise.resolve(null))
        } as any;
        handler = new GetUserByIdHandler(mockRepository);
    });

    it("should return user when user exists", async () => {
        // Arrange
        const mockUserData = zocker(userDto).generate();
        const mockUser = {
            ...mockUserData,
            passwordHash: "hashedpassword",
        } as User;
        const userId = mockUser.id;
        
        mockRepository.findOne = mock(() => Promise.resolve(mockUser));

        // Act
        const result = await handler.handle(userId);

        // Assert
        expect(result).toEqual({
            id: mockUserData.id,
            email: mockUserData.email,
            phone: mockUserData.phone,
            isActive: mockUserData.isActive,
            createdAt: mockUserData.createdAt,
            updatedAt: mockUserData.updatedAt,
        });
        expect(mockRepository.findOne).toHaveBeenCalledWith({
            where: { id: userId },
            relations: ['profiles']
        });
    });

    it("should throw NotFoundError when user does not exist", async () => {
        // Arrange
        const userId = "123e4567-e89b-12d3-a456-426614174000";
        mockRepository.findOne = mock(() => Promise.resolve(null));

        // Act & Assert
        expect(handler.handle(userId)).rejects.toThrow(NotFoundError);
        expect(handler.handle(userId)).rejects.toThrow(`User with id ${userId} not found`);
        expect(mockRepository.findOne).toHaveBeenCalledWith({
            where: { id: userId },
            relations: ['profiles']
        });
    });

    it("should handle repository errors", async () => {
        // Arrange
        const userId = "123e4567-e89b-12d3-a456-426614174000";
        const error = new Error("Database connection failed");
        mockRepository.findOne = mock(() => Promise.reject(error));

        // Act & Assert
        expect(handler.handle(userId)).rejects.toThrow("Database connection failed");
    });
});
