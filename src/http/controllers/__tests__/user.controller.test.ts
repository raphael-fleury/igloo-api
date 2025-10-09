import { describe, it, expect, beforeEach, mock } from "bun:test";
import { userController } from "../user.controller";
import { NotFoundError } from "@/app/errors";

describe("UserController", () => {
    let mockCreateUserHandler: any;
    let mockGetUsersHandler: any;
    let mockGetUserByIdHandler: any;
    let mockUpdateUserHandler: any;
    let app: any;

    beforeEach(() => {
        // Create mock handlers
        mockCreateUserHandler = {
            handle: mock(),
        };

        mockGetUsersHandler = {
            handle: mock(),
        };

        mockGetUserByIdHandler = {
            handle: mock(),
        };

        mockUpdateUserHandler = {
            handle: mock(),
        };

        // Create the controller with mocked handlers
        app = userController(
            mockCreateUserHandler,
            mockGetUsersHandler,
            mockGetUserByIdHandler,
            mockUpdateUserHandler
        );
    });

    describe("GET /users", () => {
        it("should return all users successfully", async () => {
            // Arrange
            const mockUsers = [
                {
                    id: "123e4567-e89b-12d3-a456-426614174000",
                    email: "user1@example.com",
                    phone: "+1234567890",
                    isActive: true,
                    createdAt: new Date("2025-10-08T12:00:00.000Z"),
                    updatedAt: new Date("2025-10-08T12:00:00.000Z"),
                },
                {
                    id: "123e4567-e89b-12d3-a456-426614174001",
                    email: "user2@example.com",
                    phone: "+1234567891",
                    isActive: true,
                    createdAt: new Date("2025-10-08T12:00:00.000Z"),
                    updatedAt: new Date("2025-10-08T12:00:00.000Z"),
                },
            ];

            mockGetUsersHandler.handle.mockResolvedValue(mockUsers);

            // Act
            const response = await app.handle(new Request("http://localhost/users"));

            // Assert
            expect(response.status).toBe(200);
            const responseBody = await response.json();
            expect(responseBody).toHaveLength(2);
            expect(responseBody[0].email).toBe("user1@example.com");
            expect(mockGetUsersHandler.handle).toHaveBeenCalledTimes(1);
        });

        it("should return empty array when no users exist", async () => {
            // Arrange
            mockGetUsersHandler.handle.mockResolvedValue([]);

            // Act
            const response = await app.handle(new Request("http://localhost/users"));

            // Assert
            expect(response.status).toBe(200);
            const responseBody = await response.json();
            expect(responseBody).toEqual([]);
            expect(mockGetUsersHandler.handle).toHaveBeenCalledTimes(1);
        });
    });

    describe("GET /users/:id", () => {
        it("should return user by ID successfully", async () => {
            // Arrange
            const userId = "123e4567-e89b-12d3-a456-426614174000";
            const mockUser = {
                id: userId,
                email: "user@example.com",
                phone: "+1234567890",
                isActive: true,
                createdAt: new Date("2025-10-08T12:00:00.000Z"),
                updatedAt: new Date("2025-10-08T12:00:00.000Z"),
            };

            mockGetUserByIdHandler.handle.mockResolvedValue(mockUser);

            // Act
            const response = await app.handle(
                new Request(`http://localhost/users/${userId}`)
            );

            // Assert
            expect(response.status).toBe(200);
            const responseBody = await response.json();
            expect(responseBody.id).toBe(userId);
            expect(responseBody.email).toBe("user@example.com");
            expect(mockGetUserByIdHandler.handle).toHaveBeenCalledWith(userId);
        });

        it("should return 404 when user not found", async () => {
            // Arrange
            const userId = "123e4567-e89b-12d3-a456-426614174000";
            mockGetUserByIdHandler.handle.mockRejectedValue(
                new NotFoundError(`User with id ${userId} not found`)
            );

            // Act
            const response = await app.handle(
                new Request(`http://localhost/users/${userId}`)
            );

            // Assert
            expect(response.status).toBe(404);
            const responseBody = await response.json();
            expect(responseBody).toEqual({
                message: `User with id ${userId} not found`,
            });
            expect(mockGetUserByIdHandler.handle).toHaveBeenCalledWith(userId);
        });

        it("should return 422 when ID is not a valid UUID", async () => {
            // Arrange
            const invalidId = "invalid-uuid";

            // Act
            const response = await app.handle(
                new Request(`http://localhost/users/${invalidId}`)
            );

            // Assert
            expect(response.status).toBe(422);
            expect(mockGetUserByIdHandler.handle).not.toHaveBeenCalled();
        });
    });

    describe("POST /users", () => {
        it("should create user successfully", async () => {
            // Arrange
            const createUserData = {
                email: "test@example.com",
                phone: "+1234567890",
                password: "password123",
                profile: {
                    username: "testuser",
                    displayName: "Test User",
                    bio: "Test bio",
                },
            };
            const mockCreatedUser = {
                id: "123e4567-e89b-12d3-a456-426614174000",
                email: createUserData.email,
                phone: createUserData.phone,
                isActive: true,
                createdAt: new Date("2025-10-08T12:00:00.000Z"),
                updatedAt: new Date("2025-10-08T12:00:00.000Z"),
            };

            mockCreateUserHandler.handle.mockResolvedValue(mockCreatedUser);

            // Act
            const response = await app.handle(
                new Request("http://localhost/users", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(createUserData),
                })
            );

            // Assert
            expect(response.status).toBe(201);
            const responseBody = await response.json();
            expect(responseBody.email).toBe(createUserData.email);
            expect(mockCreateUserHandler.handle).toHaveBeenCalledWith(createUserData);
        });

        it("should return 422 when required fields are missing", async () => {
            // Arrange
            const invalidUserData = {
                email: "invalid-email", // Invalid email format
                // Missing phone and password
            };

            // Act
            const response = await app.handle(
                new Request("http://localhost/users", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(invalidUserData),
                })
            );

            // Assert
            expect(response.status).toBe(422);
            expect(mockCreateUserHandler.handle).not.toHaveBeenCalled();
        });

        it("should return 422 when email format is invalid", async () => {
            // Arrange
            const invalidUserData = {
                email: "invalid-email",
                phone: "+1234567890",
                password: "password123",
                profile: {
                    username: "testuser",
                    displayName: "Test User",
                    bio: "Test bio",
                },
            };

            // Act
            const response = await app.handle(
                new Request("http://localhost/users", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(invalidUserData),
                })
            );

            // Assert
            expect(response.status).toBe(422);
            expect(mockCreateUserHandler.handle).not.toHaveBeenCalled();
        });

        it("should return 422 when phone format is invalid", async () => {
            // Arrange
            const invalidUserData = {
                email: "user@example.com",
                phone: "invalid-phone",
                password: "password123",
                profile: {
                    username: "testuser",
                    displayName: "Test User",
                    bio: "Test bio",
                },
            };

            // Act
            const response = await app.handle(
                new Request("http://localhost/users", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(invalidUserData),
                })
            );

            // Assert
            expect(response.status).toBe(422);
            expect(mockCreateUserHandler.handle).not.toHaveBeenCalled();
        });

        it("should return 422 when password is too short", async () => {
            // Arrange
            const invalidUserData = {
                email: "user@example.com",
                phone: "+1234567890",
                password: "short", // Too short (less than 8 characters)
                profile: {
                    username: "testuser",
                    displayName: "Test User",
                    bio: "Test bio",
                },
            };

            // Act
            const response = await app.handle(
                new Request("http://localhost/users", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(invalidUserData),
                })
            );

            // Assert
            expect(response.status).toBe(422);
            expect(mockCreateUserHandler.handle).not.toHaveBeenCalled();
        });
    });

    describe("PATCH /users/:id", () => {
        it("should update user successfully", async () => {
            // Arrange
            const userId = "123e4567-e89b-12d3-a456-426614174000";
            const updateData = {
                email: "updated@example.com",
                phone: "+9876543210",
            };
            const mockUpdatedUser = {
                id: userId,
                email: updateData.email,
                phone: updateData.phone,
                isActive: true,
                createdAt: new Date("2025-10-08T12:00:00.000Z"),
                updatedAt: new Date("2025-10-08T12:00:00.000Z"),
            };

            mockUpdateUserHandler.handle.mockResolvedValue(mockUpdatedUser);

            // Act
            const response = await app.handle(
                new Request(`http://localhost/users/${userId}`, {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(updateData),
                })
            );

            // Assert
            expect(response.status).toBe(200);
            const responseBody = await response.json();
            expect(responseBody.email).toBe(updateData.email);
            expect(mockUpdateUserHandler.handle).toHaveBeenCalledWith(userId, updateData);
        });

        it("should update user with partial data", async () => {
            // Arrange
            const userId = "123e4567-e89b-12d3-a456-426614174000";
            const updateData = {
                email: "updated@example.com",
                // Only updating email, phone remains the same
            };
            const mockUpdatedUser = {
                id: userId,
                email: updateData.email,
                phone: "+1234567890", // Original phone
                isActive: true,
                createdAt: new Date("2025-10-08T12:00:00.000Z"),
                updatedAt: new Date("2025-10-08T12:00:00.000Z"),
            };

            mockUpdateUserHandler.handle.mockResolvedValue(mockUpdatedUser);

            // Act
            const response = await app.handle(
                new Request(`http://localhost/users/${userId}`, {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(updateData),
                })
            );

            // Assert
            expect(response.status).toBe(200);
            const responseBody = await response.json();
            expect(responseBody.email).toBe(updateData.email);
            expect(mockUpdateUserHandler.handle).toHaveBeenCalledWith(userId, updateData);
        });

        it("should return 404 when user not found", async () => {
            // Arrange
            const userId = "123e4567-e89b-12d3-a456-426614174000";
            const updateData = {
                email: "updated@example.com",
            };

            mockUpdateUserHandler.handle.mockRejectedValue(
                new NotFoundError(`User with id ${userId} not found`)
            );

            // Act
            const response = await app.handle(
                new Request(`http://localhost/users/${userId}`, {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(updateData),
                })
            );

            // Assert
            expect(response.status).toBe(404);
            const responseBody = await response.json();
            expect(responseBody).toEqual({
                message: `User with id ${userId} not found`,
            });
            expect(mockUpdateUserHandler.handle).toHaveBeenCalledWith(userId, updateData);
        });

        it("should return 422 when ID is not a valid UUID", async () => {
            // Arrange
            const invalidId = "invalid-uuid";
            const updateData = {
                email: "updated@example.com",
            };

            // Act
            const response = await app.handle(
                new Request(`http://localhost/users/${invalidId}`, {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(updateData),
                })
            );

            // Assert
            expect(response.status).toBe(422);
            expect(mockUpdateUserHandler.handle).not.toHaveBeenCalled();
        });

        it("should return 422 when email format is invalid", async () => {
            // Arrange
            const userId = "123e4567-e89b-12d3-a456-426614174000";
            const invalidUpdateData = {
                email: "invalid-email",
            };

            // Act
            const response = await app.handle(
                new Request(`http://localhost/users/${userId}`, {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(invalidUpdateData),
                })
            );

            // Assert
            expect(response.status).toBe(422);
            expect(mockUpdateUserHandler.handle).not.toHaveBeenCalled();
        });

        it("should return 422 when phone format is invalid", async () => {
            // Arrange
            const userId = "123e4567-e89b-12d3-a456-426614174000";
            const invalidUpdateData = {
                phone: "invalid-phone",
            };

            // Act
            const response = await app.handle(
                new Request(`http://localhost/users/${userId}`, {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(invalidUpdateData),
                })
            );

            // Assert
            expect(response.status).toBe(422);
            expect(mockUpdateUserHandler.handle).not.toHaveBeenCalled();
        });

        it("should allow empty update data", async () => {
            // Arrange
            const userId = "123e4567-e89b-12d3-a456-426614174000";
            const updateData = {};
            const mockUpdatedUser = {
                id: userId,
                email: "user@example.com",
                phone: "+1234567890",
                isActive: true,
                createdAt: new Date("2025-10-08T12:00:00.000Z"),
                updatedAt: new Date("2025-10-08T12:00:00.000Z"),
            };

            mockUpdateUserHandler.handle.mockResolvedValue(mockUpdatedUser);

            // Act
            const response = await app.handle(
                new Request(`http://localhost/users/${userId}`, {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(updateData),
                })
            );

            // Assert
            expect(response.status).toBe(200);
            const responseBody = await response.json();
            expect(responseBody.email).toBe("user@example.com");
            expect(mockUpdateUserHandler.handle).toHaveBeenCalledWith(userId, updateData);
        });
    });
});