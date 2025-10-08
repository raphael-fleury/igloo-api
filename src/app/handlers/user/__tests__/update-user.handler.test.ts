import { describe, it, expect, beforeEach, mock } from "bun:test";
import { UpdateUserHandler } from "../update-user.handler";
import { Repository } from "typeorm";
import { User } from "@/database/entities/user";
import { NotFoundError, AlreadyExistsError } from "@/app/errors";
import { UpdateUserDto } from "@/app/dtos/user.dtos";

describe("UpdateUserHandler", () => {
    let handler: UpdateUserHandler;
    let mockRepository: any;

    beforeEach(() => {
        mockRepository = {
            findOneBy: mock(),
            findOne: mock(),
            save: mock(),
        };
        handler = new UpdateUserHandler(mockRepository as Repository<User>);
    });

    it("should update user successfully", async () => {
        // Arrange
        const userId = "123e4567-e89b-12d3-a456-426614174000";
        const updateData: UpdateUserDto = {
            email: "newemail@example.com",
        };
        
        const existingUser = {
            id: userId,
            email: "oldemail@example.com",
            phone: "+5511999999999",
            passwordHash: "hashedpassword",
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        } as User;

        const updatedUser = {
            ...existingUser,
            email: "newemail@example.com",
        } as User;

        mockRepository.findOneBy.mockReturnValue(Promise.resolve(existingUser));
        mockRepository.findOne.mockReturnValue(Promise.resolve(null));
        mockRepository.save.mockReturnValue(Promise.resolve(updatedUser));

        // Act
        const result = await handler.handle(userId, updateData);

        // Assert
        expect(result.email).toBe("newemail@example.com");
        expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: userId });
        expect(mockRepository.save).toHaveBeenCalled();
    });

    it("should throw NotFoundError when user does not exist", async () => {
        // Arrange
        const userId = "123e4567-e89b-12d3-a456-426614174000";
        const updateData: UpdateUserDto = {
            email: "newemail@example.com",
        };

        mockRepository.findOneBy.mockReturnValue(Promise.resolve(null));

        // Act & Assert
        expect(handler.handle(userId, updateData)).rejects.toThrow(NotFoundError);
    });

    it("should throw AlreadyExistsError when email already exists", async () => {
        // Arrange
        const userId = "123e4567-e89b-12d3-a456-426614174000";
        const updateData: UpdateUserDto = {
            email: "existing@example.com",
        };
        
        const existingUser = {
            id: userId,
            email: "oldemail@example.com",
            phone: "+5511999999999",
            passwordHash: "hashedpassword",
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        } as User;

        const conflictingUser = {
            id: "different-id",
            email: "existing@example.com",
            passwordHash: "hashedpassword",
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        } as User;

        mockRepository.findOneBy.mockReturnValue(Promise.resolve(existingUser));
        mockRepository.findOne.mockReturnValue(Promise.resolve(conflictingUser));

        // Act & Assert
        expect(handler.handle(userId, updateData)).rejects.toThrow(AlreadyExistsError);
    });
});
