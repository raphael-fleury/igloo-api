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
        
        // Filter out undefined values from partial data and ensure email is defined
        const updateData = Object.fromEntries(
            Object.entries(updateDataRaw).filter(([_, value]) => value !== undefined)
        );
        
        // Ensure we have an email to test with
        if (!updateData.email) {
            updateData.email = "newemail@example.com";
        }
        
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

    it("should update user successfully when email is not being changed", async () => {
        // Arrange
        const existingUserData = zocker(userDto).generate();
        const userId = existingUserData.id;
        
        // Use the same phone as the existing user to avoid phone conflict checks
        const updateData = {
            phone: existingUserData.phone,
        };
        
        const existingUser = {
            ...existingUserData,
            passwordHash: "hashedpassword",
        } as User;

        const updatedUser = {
            ...existingUser,
            ...updateData,
        } as User;

        mockRepository.findOneBy.mockReturnValue(Promise.resolve(existingUser));
        mockRepository.save.mockReturnValue(Promise.resolve(updatedUser));

        // Act
        const result = await handler.handle(userId, updateData);

        // Assert
        expect(result.email).toBe(existingUserData.email);
        expect(result.phone).toBe(updateData.phone);
        expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: userId });
        expect(mockRepository.save).toHaveBeenCalled();
        expect(mockRepository.findOne).not.toHaveBeenCalled(); // Should not check for conflicts
    });

    it("should update user successfully when email is being changed to the same value", async () => {
        // Arrange
        const existingUserData = zocker(userDto).generate();
        const userId = existingUserData.id;
        const updateData = {
            email: existingUserData.email, // Same email
            phone: existingUserData.phone, // Same phone
        };
        
        const existingUser = {
            ...existingUserData,
            passwordHash: "hashedpassword",
        } as User;

        const updatedUser = {
            ...existingUser,
            ...updateData,
        } as User;

        mockRepository.findOneBy.mockReturnValue(Promise.resolve(existingUser));
        mockRepository.save.mockReturnValue(Promise.resolve(updatedUser));

        // Act
        const result = await handler.handle(userId, updateData);

        // Assert
        expect(result.email).toBe(updateData.email);
        expect(result.phone).toBe(updateData.phone);
        expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: userId });
        expect(mockRepository.save).toHaveBeenCalled();
        expect(mockRepository.findOne).not.toHaveBeenCalled(); // Should not check for conflicts
    });

    it("should throw AlreadyExistsError when phone already exists", async () => {
        // Arrange
        const userId = "123e4567-e89b-12d3-a456-426614174000";
        const updateData = {
            phone: "+1234567890123",
        };
        
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
            phone: updateData.phone,
            passwordHash: "hashedpassword",
        } as User;

        mockRepository.findOneBy.mockReturnValue(Promise.resolve(existingUser));
        mockRepository.findOne.mockReturnValue(Promise.resolve(conflictingUser));

        // Act & Assert
        expect(handler.handle(userId, updateData)).rejects.toThrow(AlreadyExistsError);
    });
});
