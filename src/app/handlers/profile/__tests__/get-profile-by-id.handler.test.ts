import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Repository } from "typeorm";
import { zocker } from "zocker";
import { GetProfileByIdHandler } from "../get-profile-by-id.handler";
import { Profile } from "@/database/entities/profile";
import { NotFoundError } from "@/app/errors";
import { DetailedProfileDto, profileDto } from "@/app/dtos/profile.dtos";
import { ProfileInteraction, ProfileInteractionType } from "@/database/entities/profile-interaction";
import { idDto } from "@/app/dtos/common.dtos";

describe("GetProfileByIdHandler", () => {
    let handler: GetProfileByIdHandler;
    let mockRepository: Repository<Profile>;
    let mockInteractionRepository: Repository<ProfileInteraction>;

    beforeEach(() => {
        mockRepository = {
            findOneBy: mock(() => Promise.resolve(null)),
        } as any;
        mockInteractionRepository = {
            find: mock(() => Promise.resolve([])),
        } as any;
        handler = new GetProfileByIdHandler(mockRepository, mockInteractionRepository);
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
            createdAt: mockProfileData.createdAt,
            updatedAt: mockProfileData.updatedAt,
        });
        expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: profileId });
    });

    it("should throw NotFoundError when profile does not exist", async () => {
        // Arrange
        const profileId = zocker(idDto).generate();
        mockRepository.findOneBy = mock(() => Promise.resolve(null));

        // Act & Assert
        expect(handler.handle(profileId)).rejects.toThrow(NotFoundError);
        expect(handler.handle(profileId)).rejects.toThrow(`Profile with id ${profileId} not found`);
        expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: profileId });
    });

    it("should include relationship flags when viewer profile is provided", async () => {
        // Arrange
        const targetProfileData = zocker(profileDto).generate();
        const viewerProfileId = zocker(idDto).generate();

        const targetProfile = targetProfileData as Profile;
        const targetProfileId = targetProfile.id;

        mockRepository.findOneBy = mock(() => Promise.resolve(targetProfile));
        mockInteractionRepository.find = mock().mockResolvedValue([
            {
                interactionType: ProfileInteractionType.Block,
                sourceProfile: { id: targetProfileId },
                targetProfile: { id: viewerProfileId },
            },
            {
                interactionType: ProfileInteractionType.Mute,
                sourceProfile: { id: viewerProfileId },
                targetProfile: { id: targetProfileId },
            },
        ]);

        // Act
        const result = await handler.handle(targetProfileId, viewerProfileId) as DetailedProfileDto;

        // Assert
        expect(result.id).toBe(targetProfileId);
        expect(result.blocksMe).toBe(true);
        expect(result.blocked).toBe(false);
        expect(result.followsMe).toBe(false);
        expect(result.followed).toBe(false);
        expect(result.muted).toBe(true);
        expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: targetProfileId });
    });
});
