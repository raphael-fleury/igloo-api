import { describe, it, expect, beforeEach, mock } from "bun:test";
import { CreateUserHandler } from "../create-user.handler";
import { DataSource } from "typeorm";
import { User } from "@/database/entities/user";
import { Profile } from "@/database/entities/profile";
import { AlreadyExistsError } from "@/app/errors";
import { CreateUserDto } from "@/app/dtos/user.dtos";

describe("CreateUserHandler", () => {
    let handler: CreateUserHandler;
    let mockDataSource: any;
    let mockEntityManager: any;

    beforeEach(() => {
        mockEntityManager = {
            findOne: mock(),
            create: mock(),
            save: mock(),
        };

        mockDataSource = {
            transaction: mock(),
        };

        handler = new CreateUserHandler(mockDataSource as DataSource);
    });

    it("should create user with profile successfully", async () => {
        // Arrange
        const createUserData: CreateUserDto = {
            email: "test@example.com",
            phone: "+5511999999999",
            password: "password123",
            profile: {
                username: "testuser",
                displayName: "Test User",
                bio: "Test bio",
            },
        };

        const createdUser = {
            id: "123e4567-e89b-12d3-a456-426614174000",
            email: "test@example.com",
            phone: "+5511999999999",
            passwordHash: "password123",
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        } as User;

        const createdProfile = {
            id: "123e4567-e89b-12d3-a456-426614174001",
            username: "testuser",
            displayName: "Test User",
            bio: "Test bio",
            userId: "123e4567-e89b-12d3-a456-426614174000",
            createdAt: new Date(),
            updatedAt: new Date(),
        } as Profile;

        // Mock the transaction to call the callback with our mock entity manager
        mockDataSource.transaction.mockImplementation(async (callback: any) => {
            return callback(mockEntityManager);
        });

        // Mock entity manager methods
        mockEntityManager.findOne.mockReturnValue(Promise.resolve(null)); // No existing entities
        
        // Mock create to return the object that will be created
        const userToCreate = {
            email: "test@example.com",
            phone: "+5511999999999",
            passwordHash: "password123",
        };
        const profileToCreate = {
            username: "testuser",
            displayName: "Test User",
            bio: "Test bio",
            userId: "123e4567-e89b-12d3-a456-426614174000",
        };
        
        mockEntityManager.create
            .mockReturnValueOnce(userToCreate) // User creation
            .mockReturnValueOnce(profileToCreate); // Profile creation
        mockEntityManager.save
            .mockReturnValueOnce(Promise.resolve(createdUser)) // User save
            .mockReturnValueOnce(Promise.resolve(createdProfile)); // Profile save

        // Act
        const result = await handler.handle(createUserData);

        // Assert
        expect(result.email).toBe("test@example.com");
        expect(result.profile.username).toBe("testuser");
        expect(mockDataSource.transaction).toHaveBeenCalled();
        expect(mockEntityManager.findOne).toHaveBeenCalledTimes(3); // Check email, phone, username
        expect(mockEntityManager.create).toHaveBeenCalledTimes(2); // User and Profile
        expect(mockEntityManager.save).toHaveBeenCalledTimes(2); // User and Profile
    });

    it("should throw AlreadyExistsError when email already exists", async () => {
        // Arrange
        const createUserData: CreateUserDto = {
            email: "existing@example.com",
            phone: "+5511999999999",
            password: "password123",
            profile: {
                username: "testuser",
                displayName: "Test User",
                bio: "Test bio",
            },
        };

        const existingUser = {
            id: "existing-id",
            email: "existing@example.com",
            passwordHash: "hashedpassword",
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        } as User;

        mockDataSource.transaction.mockImplementation(async (callback: any) => {
            return callback(mockEntityManager);
        });

        mockEntityManager.findOne.mockReturnValue(Promise.resolve(existingUser));

        // Act & Assert
        expect(handler.handle(createUserData)).rejects.toThrow(AlreadyExistsError);
        expect(handler.handle(createUserData)).rejects.toThrow("Email existing@example.com already exists");
    });

    it("should throw AlreadyExistsError when phone already exists", async () => {
        // Arrange
        const createUserData: CreateUserDto = {
            email: "test@example.com",
            phone: "+5511999999999",
            password: "password123",
            profile: {
                username: "testuser",
                displayName: "Test User",
                bio: "Test bio",
            },
        };

        const existingUser = {
            id: "existing-id",
            phone: "+5511999999999",
            passwordHash: "hashedpassword",
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        } as User;

        mockDataSource.transaction.mockImplementation(async (callback: any) => {
            return callback(mockEntityManager);
        });

        mockEntityManager.findOne
            .mockReturnValueOnce(Promise.resolve(null)) // No email conflict
            .mockReturnValueOnce(Promise.resolve(existingUser)); // Phone conflict

        // Act & Assert
        expect(handler.handle(createUserData)).rejects.toThrow(AlreadyExistsError);
    });

    it("should throw AlreadyExistsError when username already exists", async () => {
        // Arrange
        const createUserData: CreateUserDto = {
            email: "test@example.com",
            phone: "+5511999999999",
            password: "password123",
            profile: {
                username: "existinguser",
                displayName: "Test User",
                bio: "Test bio",
            },
        };

        const existingProfile = {
            id: "existing-profile-id",
            username: "existinguser",
            displayName: "Existing User",
            userId: "existing-user-id",
            createdAt: new Date(),
            updatedAt: new Date(),
        } as Profile;

        mockDataSource.transaction.mockImplementation(async (callback: any) => {
            return callback(mockEntityManager);
        });

        mockEntityManager.findOne
            .mockReturnValueOnce(Promise.resolve(null)) // No email conflict
            .mockReturnValueOnce(Promise.resolve(null)) // No phone conflict
            .mockReturnValueOnce(Promise.resolve(existingProfile)); // Username conflict

        // Act & Assert
        expect(handler.handle(createUserData)).rejects.toThrow(AlreadyExistsError);
    });
});
