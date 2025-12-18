import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Repository } from "typeorm";
import { zocker } from "zocker";
import { UnmuteProfileHandler } from "../unmute-profile.handler";
import { Mute } from "@/database/entities/mute";
import { NotFoundError } from "@/app/errors";
import { profileDto } from "@/app/dtos/profile.dtos";

describe("UnmuteProfileHandler", () => {
    let handler: UnmuteProfileHandler;
    let mockRepository: Repository<Mute>;

    beforeEach(() => {
        mockRepository = {
            findOne: mock(() => Promise.resolve(null)),
            remove: mock(data => Promise.resolve(data))
        } as any;
        handler = new UnmuteProfileHandler(mockRepository);
    });

    it("should unmute profile successfully when mute exists", async () => {
        // Arrange
        const muterProfileId = "123e4567-e89b-12d3-a456-426614174000";
        const mutedProfileId = "123e4567-e89b-12d3-a456-426614174001";
        
        const muterProfile = zocker(profileDto).generate();
        const mutedProfile = zocker(profileDto).generate();
        
        const existingMute = {
            id: "mute-id",
            muterProfile,
            mutedProfile,
            createdAt: new Date(),
            updatedAt: new Date()
        } as Mute;

        mockRepository.findOne = mock(() => Promise.resolve(existingMute));

        // Act
        const result = await handler.handle(muterProfileId, mutedProfileId);

        // Assert
        expect(result.message).toBe("Profile unmuted successfully");
        expect(mockRepository.findOne).toHaveBeenCalledWith({
            where: {
                muterProfile: { id: muterProfileId },
                mutedProfile: { id: mutedProfileId }
            }
        });
        expect(mockRepository.remove).toHaveBeenCalledWith(existingMute);
    });

    it("should throw NotFoundError when mute does not exist", async () => {
        // Arrange
        const muterProfileId = "123e4567-e89b-12d3-a456-426614174000";
        const mutedProfileId = "123e4567-e89b-12d3-a456-426614174001";

        mockRepository.findOne = mock(() => Promise.resolve(null));

        // Act & Assert
        expect(handler.handle(muterProfileId, mutedProfileId)).rejects.toThrow(NotFoundError);
        expect(handler.handle(muterProfileId, mutedProfileId)).rejects.toThrow(
            "Mute between profiles not found"
        );
    });

    it("should handle repository errors", async () => {
        // Arrange
        const muterProfileId = "123e4567-e89b-12d3-a456-426614174000";
        const mutedProfileId = "123e4567-e89b-12d3-a456-426614174001";
        const error = new Error("Database connection failed");

        mockRepository.findOne = mock(() => Promise.reject(error));

        // Act & Assert
        expect(handler.handle(muterProfileId, mutedProfileId)).rejects.toThrow(
            "Database connection failed"
        );
    });
});
