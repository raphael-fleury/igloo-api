import { describe, it, expect, beforeEach, mock } from "bun:test";
import { GetUserByIdHandler } from "../get-user-by-id.handler";
import { Repository } from "typeorm";
import { User } from "@/database/entities/user";
import { NotFoundError } from "@/app/errors";

describe("GetUserByIdHandler", () => {
    let handler: GetUserByIdHandler;
    let mockRepository: Repository<User>;

    beforeEach(() => {
        mockRepository = {
            findOneBy: mock(() => Promise.resolve(null)),
        } as any;
        handler = new GetUserByIdHandler(mockRepository);
    });

    it("should return user when user exists", async () => {
        // Arrange
        const userId = "123e4567-e89b-12d3-a456-426614174000";
        const mockUser = {
            id: userId,
            email: "test@example.com",
            phone: "+5511999999999",
            passwordHash: "hashedpassword",
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        } as User;
        
        mockRepository.findOneBy = mock(() => Promise.resolve(mockUser));

        // Act
        const result = await handler.handle(userId);

        // Assert
        expect(result).toEqual({
            id: userId,
            email: "test@example.com",
            phone: "+5511999999999",
            isActive: true,
            createdAt: mockUser.createdAt,
            updatedAt: mockUser.updatedAt,
        });
        expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: userId });
    });

    it("should throw NotFoundError when user does not exist", async () => {
        // Arrange
        const userId = "123e4567-e89b-12d3-a456-426614174000";
        mockRepository.findOneBy = mock(() => Promise.resolve(null));

        // Act & Assert
        expect(handler.handle(userId)).rejects.toThrow(NotFoundError);
        expect(handler.handle(userId)).rejects.toThrow(`User with id ${userId} not found`);
        expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: userId });
    });

    it("should handle repository errors", async () => {
        // Arrange
        const userId = "123e4567-e89b-12d3-a456-426614174000";
        const error = new Error("Database connection failed");
        mockRepository.findOneBy = mock(() => Promise.reject(error));

        // Act & Assert
        expect(handler.handle(userId)).rejects.toThrow("Database connection failed");
    });
});
