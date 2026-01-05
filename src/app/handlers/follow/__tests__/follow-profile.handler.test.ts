import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Repository } from "typeorm";
import { zocker } from "zocker";
import { FollowProfileHandler } from "../follow-profile.handler";
import { ProfileInteraction, ProfileInteractionType } from "@/database/entities/profile-interaction";
import { Profile } from "@/database/entities/profile";
import { NotFoundError, SelfInteractionError, BlockedError, ConflictError } from "@/app/errors";
import { profileDto } from "@/app/dtos/profile.dtos";
import { InteractionValidator } from "@/app/validators/interaction.validator";
import { idDto } from "@/app/dtos/common.dtos";

describe("FollowProfileHandler", () => {
    let handler: FollowProfileHandler;
    let mockProfileInteractionRepository: Repository<ProfileInteraction>;
    let mockInteractionValidator: InteractionValidator;

    beforeEach(() => {
        mockProfileInteractionRepository = {
            findOne: mock(() => Promise.resolve(null)),
            create: mock(data => data),
            save: mock(data => Promise.resolve(data))
        } as any;

        mockInteractionValidator = {
            assertProfilesAreNotSame: mock(() => Promise.resolve()),
            assertProfilesDoesNotBlockEachOther: mock(() => Promise.resolve()),
            assertProfileExists: mock(() => Promise.resolve({ id: "profile-id" } as Profile))
        } as any;

        handler = new FollowProfileHandler(mockProfileInteractionRepository, mockInteractionValidator);
    });

    it("should follow profile successfully when both profiles exist and no blocks", async () => {
        // Arrange
        const sourceProfileId = zocker(idDto).generate();
        const targetProfileId = zocker(idDto).generate();
        
        const sourceProfile = zocker(profileDto).generate();
        const targetProfile = zocker(profileDto).generate();

        const createdFollow = {
            id: "follow-id",
            sourceProfile: sourceProfile,
            targetProfile: targetProfile,
            interactionType: ProfileInteractionType.Follow,
            createdAt: new Date(),
            updatedAt: new Date()
        } as ProfileInteraction;

        mockInteractionValidator.assertProfileExists = mock()
            .mockResolvedValueOnce(sourceProfile)
            .mockResolvedValueOnce(targetProfile);

        mockProfileInteractionRepository.findOne = mock(() => Promise.resolve(null));
        mockProfileInteractionRepository.save = mock(() => Promise.resolve(createdFollow)) as any;

        // Act
        await handler.handle({ sourceProfileId, targetProfileId });

        // Assert
        expect(mockProfileInteractionRepository.save).toHaveBeenCalled();
    });

    it("should throw SelfInteractionError when trying to follow the same profile", async () => {
        // Arrange
        const profileId = zocker(idDto).generate();

        mockInteractionValidator.assertProfilesAreNotSame = mock(() => {
            throw new SelfInteractionError("A profile cannot interact with itself");
        });

        // Act & Assert
        expect(handler.handle({ sourceProfileId: profileId, targetProfileId: profileId }))
            .rejects.toThrow(SelfInteractionError);
        expect(mockInteractionValidator.assertProfileExists).not.toHaveBeenCalled();
    });

    it("should throw NotFoundError when follower profile does not exist", async () => {
        // Arrange
        const sourceProfileId = zocker(idDto).generate();
        const targetProfileId = zocker(idDto).generate();

        mockInteractionValidator.assertProfileExists = mock(() => {
            throw new NotFoundError(`Profile with id ${sourceProfileId} not found`);
        });

        // Act & Assert
        expect(handler.handle({ sourceProfileId, targetProfileId }))
            .rejects.toThrow(NotFoundError);
    });

    it("should throw NotFoundError when followed profile does not exist", async () => {
        // Arrange
        const sourceProfileId = zocker(idDto).generate();
        const targetProfileId = zocker(idDto).generate();
        
        const sourceProfile = zocker(profileDto).generate();

        mockInteractionValidator.assertProfileExists = mock((profileId: string) => {
            if (profileId === sourceProfileId) {
                return Promise.resolve(sourceProfile);
            }
            throw new NotFoundError(`Profile with id ${targetProfileId} not found`);
        });

        // Act & Assert
        expect(handler.handle({ sourceProfileId, targetProfileId }))
            .rejects.toThrow(NotFoundError);
    });

    it("should throw BlockedError when follower has blocked the followed profile", async () => {
        // Arrange
        const sourceProfileId = zocker(idDto).generate();
        const targetProfileId = zocker(idDto).generate();

        mockInteractionValidator.assertProfilesDoesNotBlockEachOther = mock(() => {
            throw new BlockedError("You cannot interact with a profile you have blocked");
        });

        // Act & Assert
        expect(handler.handle({ sourceProfileId, targetProfileId }))
            .rejects.toThrow(BlockedError);
    });

    it("should throw BlockedError when followed profile has blocked the follower", async () => {
        // Arrange
        const sourceProfileId = zocker(idDto).generate();
        const targetProfileId = zocker(idDto).generate();

        mockInteractionValidator.assertProfilesDoesNotBlockEachOther = mock(() => {
            throw new BlockedError("You cannot interact with a profile that has blocked you");
        });

        // Act & Assert
        expect(handler.handle({ sourceProfileId, targetProfileId }))
            .rejects.toThrow(BlockedError);
    });

    it("should throw ConflictError when already following", async () => {
        // Arrange
        const sourceProfileId = zocker(idDto).generate();
        const targetProfileId = zocker(idDto).generate();
        
        const sourceProfile = zocker(profileDto).generate();
        const targetProfile = zocker(profileDto).generate();
        const existingFollow = {
            id: "follow-id",
            sourceProfile: sourceProfile,
            targetProfile: targetProfile,
            interactionType: ProfileInteractionType.Follow,
            createdAt: new Date("2024-01-01"),
            updatedAt: new Date("2024-01-01")
        } as ProfileInteraction;

        mockInteractionValidator.assertProfileExists = mock()
            .mockResolvedValueOnce(sourceProfile)
            .mockResolvedValueOnce(targetProfile);

        mockProfileInteractionRepository.findOne = mock(() => Promise.resolve(existingFollow));

        // Act & Assert
        expect(handler.handle({ sourceProfileId, targetProfileId }))
            .rejects.toThrow(ConflictError);
        expect(handler.handle({ sourceProfileId, targetProfileId }))
            .rejects.toThrow("Profile is already followed");
        expect(mockProfileInteractionRepository.save).not.toHaveBeenCalled();
    });
});
