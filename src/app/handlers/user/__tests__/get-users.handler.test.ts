import { describe, it, expect, beforeEach, mock } from "bun:test";
import { GetUsersHandler } from "../get-users.handler";
import { Repository } from "typeorm";
import { User } from "@/database/entities/user";

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
        const mockUsers = [
            {
                id: "123e4567-e89b-12d3-a456-426614174000",
                email: "test1@example.com",
                phone: "+5511999999999",
                passwordHash: "hashedpassword1",
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: "123e4567-e89b-12d3-a456-426614174001",
                email: "test2@example.com",
                phone: "+5511999999998",
                passwordHash: "hashedpassword2",
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ] as User[];
        mockRepository.find = mock(() => Promise.resolve(mockUsers));

        // Act
        const result = await handler.handle();

        // Assert
        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({
            id: "123e4567-e89b-12d3-a456-426614174000",
            email: "test1@example.com",
            phone: "+5511999999999",
            isActive: true,
            createdAt: mockUsers[0].createdAt,
            updatedAt: mockUsers[0].updatedAt,
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
