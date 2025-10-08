import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Repository } from "typeorm";
import { zocker } from "zocker";
import { UpdateUserHandler } from "../update-user.handler";
import { User } from "@/database/entities/user";
import { NotFoundError, AlreadyExistsError } from "@/app/errors";
import { updateUserDto, userDto } from "@/app/dtos/user.dtos";

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
        const existingUserData = zocker(userDto).generate();
        const userId = existingUserData.id;
        const updateDataRaw = zocker(updateUserDto).generate();
        
        // Filter out undefined values from partial data
        const updateData = Object.fromEntries(
            Object.entries(updateDataRaw).filter(([_, value]) => value !== undefined)
        );
        
        const existingUser = {
            ...existingUserData,
            passwordHash: "hashedpassword",
        } as User;

        const updatedUser = {
            ...existingUser,
            ...updateData,
        } as User;

        mockRepository.findOneBy.mockReturnValue(Promise.resolve(existingUser));
        mockRepository.findOne.mockReturnValue(Promise.resolve(null));
        mockRepository.save.mockReturnValue(Promise.resolve(updatedUser));

        // Act
        const result = await handler.handle(userId, updateData);

        // Assert
        expect(result.email).toBe(updateData.email || existingUserData.email);
        expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: userId });
        expect(mockRepository.save).toHaveBeenCalled();
    });

    it("should throw NotFoundError when user does not exist", async () => {
        // Arrange
        const userId = "123e4567-e89b-12d3-a456-426614174000";
        const updateDataRaw = zocker(updateUserDto).generate();
        
        // Filter out undefined values from partial data
        const updateData = Object.fromEntries(
            Object.entries(updateDataRaw).filter(([_, value]) => value !== undefined)
        );

        mockRepository.findOneBy.mockReturnValue(Promise.resolve(null));

        // Act & Assert
        expect(handler.handle(userId, updateData)).rejects.toThrow(NotFoundError);
    });

    it("should throw AlreadyExistsError when email already exists", async () => {
        // Arrange
        const userId = "123e4567-e89b-12d3-a456-426614174000";
        const updateDataRaw = zocker(updateUserDto).generate();
        
        // Filter out undefined values from partial data
        const updateData = Object.fromEntries(
            Object.entries(updateDataRaw).filter(([_, value]) => value !== undefined)
        );
        
        const existingUserData = zocker(userDto).generate();
        const existingUser = {
            ...existingUserData,
            id: userId,
            passwordHash: "hashedpassword",
        } as User;

        const conflictingUserData = zocker(userDto).generate();
        const conflictingUser = {
            ...conflictingUserData,
            id: "different-id",
            email: updateData.email,
            passwordHash: "hashedpassword",
        } as User;

        mockRepository.findOneBy.mockReturnValue(Promise.resolve(existingUser));
        mockRepository.findOne.mockReturnValue(Promise.resolve(conflictingUser));

        // Act & Assert
        expect(handler.handle(userId, updateData)).rejects.toThrow(AlreadyExistsError);
    });
});
