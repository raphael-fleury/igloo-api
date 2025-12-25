import { describe, it, expect, beforeEach, mock } from "bun:test";
import { DataSource } from "typeorm";
import { zocker } from "zocker";
import { CreateUserHandler } from "../create-user.handler";
import { User } from "@/database/entities/user";
import { Profile } from "@/database/entities/profile";
import { UserProfile } from "@/database/entities/user-profile";
import { AlreadyExistsError } from "@/app/errors";
import { createUserDto, userDto } from "@/app/dtos/user.dtos";
import { PasswordHashService } from "@/app/services/password-hash.service";
import { profileDto } from "@/app/dtos/profile.dtos";
import { idDto } from "@/app/dtos/common.dtos";

describe("CreateUserHandler", () => {
    let handler: CreateUserHandler;
    let mockDataSource: any;
    let mockEntityManager: any;
    let mockHasher: any;

    beforeEach(() => {
        mockEntityManager = {
            findOne: mock(),
            create: mock(),
            save: mock(),
        };

        mockDataSource = {
            transaction: mock().mockImplementation(async (callback: any) => {
                return callback(mockEntityManager);
            })
        };

        mockHasher = {
            hash: mock((data) => data)
        }

        handler = new CreateUserHandler(
            mockDataSource as DataSource,
            mockHasher as PasswordHashService
        );
    });

    it("should create user with profile successfully", async () => {
        // Arrange
        const createUserData = zocker(createUserDto).generate();

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

        const createdUser = {
            ...zocker(userDto).generate(),
            ...userToCreate
        } as User;

        const createdProfile = {
            ...zocker(profileDto).generate(),
            ...profileToCreate
        } as Profile;

        const userProfileToCreate = {
            user: createdUser,
            profile: createdProfile,
        };

        const createdUserProfile = {
            id: zocker(idDto).generate(),
            ...userProfileToCreate,
            createdAt: new Date(),
            updatedAt: new Date(),
        } as UserProfile;

        // Mock entity manager methods
        mockEntityManager.findOne.mockReturnValue(Promise.resolve(null)); // No existing entities

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
            ...zocker(userDto).generate(),
            email: createUserData.email
        } as User;

        mockEntityManager.findOne.mockReturnValue(Promise.resolve(existingUser));

        // Act & Assert
        expect(handler.handle(createUserData)).rejects.toThrow(AlreadyExistsError);
        expect(handler.handle(createUserData)).rejects.toThrow(`Email ${createUserData.email} already exists`);
    });

    it("should throw AlreadyExistsError when phone already exists", async () => {
        // Arrange
        const createUserData = zocker(createUserDto).generate();

        const existingUser = {
            ...zocker(userDto).generate(),
            phone: createUserData.phone
        } as User;

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
            ...zocker(profileDto).generate(),
            username: createUserData.profile.username
        } as Profile;

        mockEntityManager.findOne
            .mockReturnValueOnce(Promise.resolve(null)) // No email conflict
            .mockReturnValueOnce(Promise.resolve(null)) // No phone conflict
            .mockReturnValueOnce(Promise.resolve(existingProfile)); // Username conflict

        // Act & Assert
        expect(handler.handle(createUserData)).rejects.toThrow(AlreadyExistsError);
    });
});
