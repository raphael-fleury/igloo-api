import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Repository } from "typeorm";
import { zocker } from "zocker";
import { GetMutedProfilesHandler } from "../get-muted-profiles.handler";
import { ProfileInteraction, ProfileInteractionType } from "@/database/entities/profile-interaction";
import { profileDto } from "@/app/dtos/profile.dtos";
import { idDto } from "@/app/dtos/common.dtos";

describe("GetMutedProfilesHandler", () => {
    let handler: GetMutedProfilesHandler;
    let mockProfileInteractionRepository: Repository<ProfileInteraction>;

    beforeEach(() => {
        mockProfileInteractionRepository = {
            find: mock(() => Promise.resolve([]))
        } as any;
        handler = new GetMutedProfilesHandler(mockProfileInteractionRepository);
    });

    it("should return muted profiles successfully", async () => {
        // Arrange
        const muterProfileId = zocker(idDto).generate();
        const mutedProfile = zocker(profileDto).generate();
        const mute = {
            id: "mute-id-1",
            sourceProfile: { id: muterProfileId },
            targetProfile: mutedProfile,
            interactionType: ProfileInteractionType.Mute,
            createdAt: new Date(),
            updatedAt: new Date()
        } as ProfileInteraction;

        mockProfileInteractionRepository.find = mock(() => Promise.resolve([mute]));

        // Act
        const result = await handler.handle(muterProfileId);

        // Assert
        expect(result.total).toBe(1);
        expect(result.profiles).toHaveLength(1);
        expect(result.profiles[0].username).toBe(mutedProfile.username);
        expect(result.profiles[0].mutedAt).toEqual(mute.createdAt);
        expect(mockProfileInteractionRepository.find).toHaveBeenCalledWith({
            where: {
                sourceProfile: { id: muterProfileId },
                interactionType: ProfileInteractionType.Mute
            },
            relations: ["targetProfile"],
            order: {
                createdAt: "DESC"
            }
        });
    });

    it("should return empty list when no muted profiles", async () => {
        // Arrange
        const muterProfileId = "123e4567-e89b-12d3-a456-426614174000";
        mockProfileInteractionRepository.find = mock(() => Promise.resolve([]));

        // Act
        const result = await handler.handle(muterProfileId);

        // Assert
        expect(result.total).toBe(0);
        expect(result.profiles).toHaveLength(0);
    });

    it("should handle repository errors", async () => {
        // Arrange
        const muterProfileId = "123e4567-e89b-12d3-a456-426614174000";
        const error = new Error("Database connection failed");
        mockProfileInteractionRepository.find = mock(() => Promise.reject(error));

        // Act & Assert
        expect(handler.handle(muterProfileId)).rejects.toThrow("Database connection failed");
    });
});
