import { describe, it, expect, beforeEach, mock } from "bun:test";
import { DataSource } from "typeorm";
import { zocker } from "zocker";
import { CreateUserHandler } from "../create-user.handler";
import { User } from "@/database/entities/user";
import { Profile } from "@/database/entities/profile";
import { UserProfile } from "@/database/entities/user-profile";
import { AlreadyExistsError } from "@/app/errors";
import { createUserDto } from "@/app/dtos/user.dtos";

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
        (Bun as any).password = { hash: mock(() => Promise.resolve("hashed")) };
    });

    it("should create user with profile successfully", async () => {
        // Arrange
        const createUserData = zocker(createUserDto).generate();

        const createdUser = {
            id: "123e4567-e89b-12d3-a456-426614174000",
            email: createUserData.email,
            phone: createUserData.phone,
            passwordHash: createUserData.password,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        } as User;

        const createdProfile = {
            id: "123e4567-e89b-12d3-a456-426614174001",
            username: createUserData.profile.username,
            displayName: createUserData.profile.displayName,
            bio: createUserData.profile.bio,
            createdAt: new Date(),
            updatedAt: new Date(),
        } as Profile;

        const createdUserProfile = {
            id: "123e4567-e89b-12d3-a456-426614174002",
            user: createdUser,
            profile: createdProfile,
            createdAt: new Date(),
            updatedAt: new Date(),
        } as UserProfile;

        // Mock the transaction to call the callback with our mock entity manager
        mockDataSource.transaction.mockImplementation(async (callback: any) => {
            return callback(mockEntityManager);
        });

        // Mock entity manager methods
        mockEntityManager.findOne.mockReturnValue(Promise.resolve(null)); // No existing entities
        
        // Mock create to return the object that will be created
        const userToCreate = {
            email: createUserData.email,
            phone: createUserData.phone,
            passwordHash: createUserData.password,
        };
        const profileToCreate = {
            username: createUserData.profile.username,
            displayName: createUserData.profile.displayName,
            bio: createUserData.profile.bio,
        };

        const userProfileToCreate = {
            user: createdUser,
            profile: createdProfile,
        };
        
        mockEntityManager.create
            .mockReturnValueOnce(userToCreate)
            .mockReturnValueOnce(profileToCreate)
            .mockReturnValueOnce(userProfileToCreate);
        mockEntityManager.save
            .mockReturnValueOnce(Promise.resolve(createdUser))
            .mockReturnValueOnce(Promise.resolve(createdProfile))
            .mockReturnValueOnce(Promise.resolve(createdUserProfile));

        // Act
        const result = await handler.handle(createUserData);

        // Assert
        expect(result.email).toBe(createUserData.email);
        expect(result.profile.username).toBe(createUserData.profile.username);
        expect(mockDataSource.transaction).toHaveBeenCalled();
        expect(mockEntityManager.findOne).toHaveBeenCalledTimes(3); // Check email, phone, username
        expect(mockEntityManager.create).toHaveBeenCalledTimes(3); // User, Profile, and UserProfile
        expect(mockEntityManager.save).toHaveBeenCalledTimes(3); // User, Profile, and UserProfile
    });

    it("should throw AlreadyExistsError when email already exists", async () => {
        // Arrange
        const createUserData = zocker(createUserDto).generate();

        const existingUser = {
            id: "existing-id",
            email: createUserData.email,
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
        expect(handler.handle(createUserData)).rejects.toThrow(`Email ${createUserData.email} already exists`);
    });

    it("should throw AlreadyExistsError when phone already exists", async () => {
        // Arrange
        const createUserData = zocker(createUserDto).generate();

        const existingUser = {
            id: "existing-id",
            phone: createUserData.phone,
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
        const createUserData = zocker(createUserDto).generate();

        const existingProfile = {
            id: "existing-profile-id",
            username: createUserData.profile.username,
            displayName: "Existing User",
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
