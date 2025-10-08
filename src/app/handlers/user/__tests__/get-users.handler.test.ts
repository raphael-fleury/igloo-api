import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Repository } from "typeorm";
import { zocker } from "zocker";
import { GetUsersHandler } from "../get-users.handler";
import { User } from "@/database/entities/user";
import { userDto } from "@/app/dtos/user.dtos";

describe("GetUsersHandler", () => {
    let handler: GetUsersHandler;
    let mockRepository: Repository<User>;

    beforeEach(() => {
        mockRepository = {
            find: mock(() => Promise.resolve([])),
        } as any;
        handler = new GetUsersHandler(mockRepository);
    });

    it("should return empty array when no users exist", async () => {
        // Arrange
        mockRepository.find = mock(() => Promise.resolve([]));

        // Act
        const result = await handler.handle();

        // Assert
        expect(result).toEqual([]);
        expect(mockRepository.find).toHaveBeenCalledTimes(1);
    });

    it("should return array of users when users exist", async () => {
        // Arrange
        const mockUser1 = zocker(userDto).generate();
        const mockUser2 = zocker(userDto).generate();
        const mockUsers = [mockUser1, mockUser2] as User[];
        mockRepository.find = mock(() => Promise.resolve(mockUsers));

        // Act
        const result = await handler.handle();

        // Assert
        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({
            id: mockUser1.id,
            email: mockUser1.email,
            phone: mockUser1.phone,
            isActive: mockUser1.isActive,
            createdAt: mockUser1.createdAt,
            updatedAt: mockUser1.updatedAt,
        });
        expect(mockRepository.find).toHaveBeenCalledTimes(1);
    });

    it("should handle repository errors", async () => {
        // Arrange
        const error = new Error("Database connection failed");
        mockRepository.find = mock(() => Promise.reject(error));

        // Act & Assert
        expect(handler.handle()).rejects.toThrow("Database connection failed");
    });
});
