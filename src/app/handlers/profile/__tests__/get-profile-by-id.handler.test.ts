import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Repository } from "typeorm";
import { zocker } from "zocker";
import { GetProfileByIdHandler } from "../get-profile-by-id.handler";
import { Profile } from "@/database/entities/profile";
import { NotFoundError } from "@/app/errors";
import { profileDto } from "@/app/dtos/profile.dtos";

describe("GetProfileByIdHandler", () => {
    let handler: GetProfileByIdHandler;
    let mockRepository: Repository<Profile>;

    beforeEach(() => {
        mockRepository = {
            findOneBy: mock(() => Promise.resolve(null)),
        } as any;
        handler = new GetProfileByIdHandler(mockRepository);
    });

    it("should return profile when profile exists", async () => {
        // Arrange
        const mockProfileData = zocker(profileDto).generate();
        const mockProfile = mockProfileData as Profile;
        const profileId = mockProfile.id;
        
        mockRepository.findOneBy = mock(() => Promise.resolve(mockProfile));

        // Act
        const result = await handler.handle(profileId);

        // Assert
        expect(result).toEqual({
            id: mockProfileData.id,
            username: mockProfileData.username,
            displayName: mockProfileData.displayName,
            bio: mockProfileData.bio,
            userId: mockProfileData.userId,
            createdAt: mockProfileData.createdAt,
            updatedAt: mockProfileData.updatedAt,
        });
        expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: profileId });
    });

    it("should throw NotFoundError when profile does not exist", async () => {
        // Arrange
        const profileId = "123e4567-e89b-12d3-a456-426614174000";
        mockRepository.findOneBy = mock(() => Promise.resolve(null));

        // Act & Assert
        expect(handler.handle(profileId)).rejects.toThrow(NotFoundError);
        expect(handler.handle(profileId)).rejects.toThrow(`Profile with id ${profileId} not found`);
        expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: profileId });
    });

    it("should handle repository errors", async () => {
        // Arrange
        const profileId = "123e4567-e89b-12d3-a456-426614174000";
        const error = new Error("Database connection failed");
        mockRepository.findOneBy = mock(() => Promise.reject(error));

        // Act & Assert
        expect(handler.handle(profileId)).rejects.toThrow("Database connection failed");
    });
});
