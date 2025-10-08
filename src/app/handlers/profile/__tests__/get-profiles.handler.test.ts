import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Repository } from "typeorm";
import { zocker } from "zocker";
import { GetProfilesHandler } from "../get-profiles.handler";
import { Profile } from "@/database/entities/profile";
import { profileDto } from "@/app/dtos/profile.dtos";

describe("GetProfilesHandler", () => {
    let handler: GetProfilesHandler;
    let mockRepository: Repository<Profile>;

    beforeEach(() => {
        mockRepository = {
            find: mock(() => Promise.resolve([])),
        } as any;
        handler = new GetProfilesHandler(mockRepository);
    });

    it("should return empty array when no profiles exist", async () => {
        // Arrange
        mockRepository.find = mock(() => Promise.resolve([]));

        // Act
        const result = await handler.handle();

        // Assert
        expect(result).toEqual([]);
        expect(mockRepository.find).toHaveBeenCalledTimes(1);
    });

    it("should return array of profiles when profiles exist", async () => {
        // Arrange
        const mockProfile1 = zocker(profileDto).generate();
        const mockProfile2 = zocker(profileDto).generate();
        const mockProfiles = [mockProfile1, mockProfile2] as Profile[];
        mockRepository.find = mock(() => Promise.resolve(mockProfiles));

        // Act
        const result = await handler.handle();

        // Assert
        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({
            id: mockProfile1.id,
            username: mockProfile1.username,
            displayName: mockProfile1.displayName,
            bio: mockProfile1.bio,
            userId: mockProfile1.userId,
            createdAt: mockProfile1.createdAt,
            updatedAt: mockProfile1.updatedAt,
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
