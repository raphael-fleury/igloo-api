import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Repository } from "typeorm";
import { zocker } from "zocker";
import { UpdateProfileHandler } from "../update-profile.handler";
import { Profile } from "@/database/entities/profile";
import { NotFoundError, AlreadyExistsError } from "@/app/errors";
import { updateProfileDto, profileDto } from "@/app/dtos/profile.dtos";

describe("UpdateProfileHandler", () => {
    let handler: UpdateProfileHandler;
    let mockRepository: any;

    beforeEach(() => {
        mockRepository = {
            findOneBy: mock(),
            findOne: mock(),
            save: mock(),
        };
        handler = new UpdateProfileHandler(mockRepository as Repository<Profile>);
    });

    it("should update profile successfully", async () => {
        // Arrange
        const existingProfileData = zocker(profileDto).generate();
        const profileId = existingProfileData.id;
        const updateDataRaw = zocker(updateProfileDto).generate();
        
        // Filter out undefined values from partial data
        const updateData = Object.fromEntries(
            Object.entries(updateDataRaw).filter(([_, value]) => value !== undefined)
        );
        
        const existingProfile = existingProfileData as Profile;

        const updatedProfile = {
            ...existingProfile,
            ...updateData,
        } as Profile;

        mockRepository.findOneBy.mockReturnValue(Promise.resolve(existingProfile));
        mockRepository.findOne.mockReturnValue(Promise.resolve(null));
        mockRepository.save.mockReturnValue(Promise.resolve(updatedProfile));

        // Act
        const result = await handler.handle({ id: profileId, data: updateData });

        // Assert
        expect(result.username).toBe(updateData.username || existingProfileData.username);
        expect(result.displayName).toBe(updateData.displayName || existingProfileData.displayName);
        expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: profileId });
        expect(mockRepository.save).toHaveBeenCalled();
    });

    it("should throw NotFoundError when profile does not exist", async () => {
        // Arrange
        const profileId = "123e4567-e89b-12d3-a456-426614174000";
        const updateDataRaw = zocker(updateProfileDto).generate();
        
        // Filter out undefined values from partial data
        const updateData = Object.fromEntries(
            Object.entries(updateDataRaw).filter(([_, value]) => value !== undefined)
        );

        mockRepository.findOneBy.mockReturnValue(Promise.resolve(null));

        // Act & Assert
        expect(handler.handle({ id: profileId, data: updateData })).rejects.toThrow(NotFoundError);
    });

    it("should throw AlreadyExistsError when username already exists", async () => {
        // Arrange
        const profileId = "123e4567-e89b-12d3-a456-426614174000";
        const updateDataRaw = zocker(updateProfileDto).generate();
        
        // Filter out undefined values from partial data and ensure username is defined
        const updateData = Object.fromEntries(
            Object.entries(updateDataRaw).filter(([_, value]) => value !== undefined)
        );
        
        // Ensure we have a username to test with
        if (!updateData.username) {
            updateData.username = "newusername";
        }
        
        const existingProfileData = zocker(profileDto).generate();
        const existingProfile = {
            ...existingProfileData,
            id: profileId,
        } as Profile;

        const conflictingProfileData = zocker(profileDto).generate();
        const conflictingProfile = {
            ...conflictingProfileData,
            id: "different-id",
            username: updateData.username,
        } as Profile;

        mockRepository.findOneBy.mockReturnValue(Promise.resolve(existingProfile));
        mockRepository.findOne.mockReturnValue(Promise.resolve(conflictingProfile));

        // Act & Assert
        expect(handler.handle({ id: profileId, data: updateData })).rejects.toThrow(AlreadyExistsError);
    });

    it("should update profile successfully when username is not being changed", async () => {
        // Arrange
        const existingProfileData = zocker(profileDto).generate();
        const profileId = existingProfileData.id;
        const updateData = {
            displayName: "New Display Name",
            bio: "New bio content",
        };
        
        const existingProfile = existingProfileData as Profile;

        const updatedProfile = {
            ...existingProfile,
            ...updateData,
        } as Profile;

        mockRepository.findOneBy.mockReturnValue(Promise.resolve(existingProfile));
        mockRepository.save.mockReturnValue(Promise.resolve(updatedProfile));

        // Act
        const result = await handler.handle({ id: profileId, data: updateData });

        // Assert
        expect(result.username).toBe(existingProfileData.username);
        expect(result.displayName).toBe(updateData.displayName);
        expect(result.bio).toBe(updateData.bio);
        expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: profileId });
        expect(mockRepository.save).toHaveBeenCalled();
        expect(mockRepository.findOne).not.toHaveBeenCalled(); // Should not check for username conflicts
    });

    it("should update profile successfully when username is being changed to the same value", async () => {
        // Arrange
        const existingProfileData = zocker(profileDto).generate();
        const profileId = existingProfileData.id;
        const updateData = {
            username: existingProfileData.username, // Same username
            displayName: "New Display Name",
        };
        
        const existingProfile = existingProfileData as Profile;

        const updatedProfile = {
            ...existingProfile,
            ...updateData,
        } as Profile;

        mockRepository.findOneBy.mockReturnValue(Promise.resolve(existingProfile));
        mockRepository.save.mockReturnValue(Promise.resolve(updatedProfile));

        // Act
        const result = await handler.handle({ id: profileId, data: updateData });

        // Assert
        expect(result.username).toBe(updateData.username);
        expect(result.displayName).toBe(updateData.displayName);
        expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: profileId });
        expect(mockRepository.save).toHaveBeenCalled();
        expect(mockRepository.findOne).not.toHaveBeenCalled(); // Should not check for username conflicts
    });
});
