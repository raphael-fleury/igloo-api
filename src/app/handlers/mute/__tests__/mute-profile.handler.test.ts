import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Repository } from "typeorm";
import { zocker } from "zocker";
import { MuteProfileHandler } from "../mute-profile.handler";
import { ProfileInteraction, ProfileInteractionType } from "@/database/entities/profile-interaction";
import { Profile } from "@/database/entities/profile";
import { NotFoundError, SelfInteractionError } from "@/app/errors";
import { profileDto } from "@/app/dtos/profile.dtos";
import { InteractionValidator } from "@/app/validators/interaction.validator";

describe("MuteProfileHandler", () => {
    let handler: MuteProfileHandler;
    let mockProfileInteractionRepository: Repository<ProfileInteraction>;
    let mockProfileRepository: Repository<Profile>;
    let mockInteractionValidator: InteractionValidator;

    beforeEach(() => {
        mockProfileInteractionRepository = {
            findOne: mock(() => Promise.resolve(null)),
            create: mock(data => data),
            save: mock(data => Promise.resolve(data))
        } as any;

        mockProfileRepository = {
            findOneBy: mock(() => Promise.resolve(null))
        } as any;

        mockInteractionValidator = {
            assertProfilesAreNotSame: mock(() => Promise.resolve()),
            assertProfileExists: mock(() => Promise.resolve({ id: "profile-id" } as Profile))
        } as any;

        handler = new MuteProfileHandler(mockProfileInteractionRepository, mockProfileRepository, mockInteractionValidator);
    });

    it("should mute profile successfully when both profiles exist", async () => {
        // Arrange
        const muterProfileId = "123e4567-e89b-12d3-a456-426614174000";
        const mutedProfileId = "123e4567-e89b-12d3-a456-426614174001";
        
        const muterProfile = zocker(profileDto).generate();
        const mutedProfile = zocker(profileDto).generate();

        const createdMute = {
            id: "mute-id",
            sourceProfile: muterProfile,
            targetProfile: mutedProfile,
            interactionType: ProfileInteractionType.Mute,
            createdAt: new Date(),
            updatedAt: new Date()
        } as ProfileInteraction;

        mockInteractionValidator.assertProfileExists = mock()
            .mockResolvedValueOnce(muterProfile)
            .mockResolvedValueOnce(mutedProfile);

        mockProfileInteractionRepository.findOne = mock(() => Promise.resolve(null));
        mockProfileInteractionRepository.save = mock(() => Promise.resolve(createdMute)) as any;

        // Act
        const result = await handler.handle(muterProfileId, mutedProfileId);

        // Assert
        expect(result.message).toBe("Profile muted successfully");
        expect(result.mutedAt).toEqual(createdMute.createdAt);
        expect(mockProfileInteractionRepository.save).toHaveBeenCalled();
    });

    it("should throw NotFoundError when muter profile does not exist", async () => {
        // Arrange
        const muterProfileId = "123e4567-e89b-12d3-a456-426614174000";
        const mutedProfileId = "123e4567-e89b-12d3-a456-426614174001";

        mockInteractionValidator.assertProfileExists = mock(() => {
            throw new NotFoundError(`Profile with id ${muterProfileId} not found`);
        });

        // Act & Assert
        expect(handler.handle(muterProfileId, mutedProfileId)).rejects.toThrow(NotFoundError);
    });

    it("should throw NotFoundError when muted profile does not exist", async () => {
        // Arrange
        const muterProfileId = "123e4567-e89b-12d3-a456-426614174000";
        const mutedProfileId = "123e4567-e89b-12d3-a456-426614174001";
        
        const muterProfile = zocker(profileDto).generate();

        mockInteractionValidator.assertProfileExists = mock((profileId: string) => {
            if (profileId === muterProfileId) {
                return Promise.resolve(muterProfile);
            }
            throw new NotFoundError(`Profile with id ${mutedProfileId} not found`);
        });

        // Act & Assert
        expect(handler.handle(muterProfileId, mutedProfileId)).rejects.toThrow(NotFoundError);
    });

    it("should return existing mute when already muted", async () => {
        // Arrange
        const muterProfileId = "123e4567-e89b-12d3-a456-426614174000";
        const mutedProfileId = "123e4567-e89b-12d3-a456-426614174001";
        
        const muterProfile = zocker(profileDto).generate();
        const mutedProfile = zocker(profileDto).generate();
        const existingMute = {
            id: "mute-id",
            sourceProfile: muterProfile,
            targetProfile: mutedProfile,
            interactionType: ProfileInteractionType.Mute,
            createdAt: new Date("2024-01-01"),
            updatedAt: new Date("2024-01-01")
        } as ProfileInteraction;

        mockInteractionValidator.assertProfileExists = mock()
            .mockResolvedValueOnce(muterProfile)
            .mockResolvedValueOnce(mutedProfile);

        mockProfileInteractionRepository.findOne = mock(() => Promise.resolve(existingMute));

        // Act
        const result = await handler.handle(muterProfileId, mutedProfileId);

        // Assert
        expect(result.message).toBe("Profile is already muted");
        expect(result.mutedAt).toEqual(existingMute.createdAt);
        expect(mockProfileInteractionRepository.save).not.toHaveBeenCalled();
    });

    it("should throw SelfInteractionError when trying to mute the same profile", async () => {
        // Arrange
        const profileId = "123e4567-e89b-12d3-a456-426614174000";

        mockInteractionValidator.assertProfilesAreNotSame = mock(() => {
            throw new SelfInteractionError("A profile cannot interact with itself");
        });

        // Act & Assert
        expect(handler.handle(profileId, profileId)).rejects.toThrow(SelfInteractionError);
        expect(mockInteractionValidator.assertProfileExists).not.toHaveBeenCalled();
    });
});
