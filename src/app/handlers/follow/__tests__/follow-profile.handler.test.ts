import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Repository } from "typeorm";
import { zocker } from "zocker";
import { FollowProfileHandler } from "../follow-profile.handler";
import { Follow } from "@/database/entities/follow";
import { Profile } from "@/database/entities/profile";
import { Block } from "@/database/entities/block";
import { NotFoundError, SelfInteractionError, BlockedError } from "@/app/errors";
import { profileDto } from "@/app/dtos/profile.dtos";

describe("FollowProfileHandler", () => {
    let handler: FollowProfileHandler;
    let mockFollowRepository: Repository<Follow>;
    let mockProfileRepository: Repository<Profile>;
    let mockBlockRepository: Repository<Block>;

    beforeEach(() => {
        mockFollowRepository = {
            findOne: mock(() => Promise.resolve(null)),
            create: mock(data => data),
            save: mock(data => Promise.resolve(data))
        } as any;

        mockProfileRepository = {
            findOneBy: mock(() => Promise.resolve(null))
        } as any;

        mockBlockRepository = {
            findOne: mock(() => Promise.resolve(null))
        } as any;

        handler = new FollowProfileHandler(mockFollowRepository, mockProfileRepository, mockBlockRepository);
    });

    it("should follow profile successfully when both profiles exist and no blocks", async () => {
        // Arrange
        const followerProfileId = "123e4567-e89b-12d3-a456-426614174000";
        const followedProfileId = "123e4567-e89b-12d3-a456-426614174001";
        
        const followerProfile = zocker(profileDto).generate();
        const followedProfile = zocker(profileDto).generate();

        const createdFollow = {
            id: "follow-id",
            followerProfile,
            followedProfile,
            createdAt: new Date(),
            updatedAt: new Date()
        } as Follow;

        mockProfileRepository.findOneBy = mock()
            .mockReturnValueOnce(Promise.resolve(followerProfile))
            .mockReturnValueOnce(Promise.resolve(followedProfile));

        mockBlockRepository.findOne = mock(() => Promise.resolve(null));
        mockFollowRepository.findOne = mock(() => Promise.resolve(null));
        mockFollowRepository.save = mock(() => Promise.resolve(createdFollow)) as any;

        // Act
        const result = await handler.handle(followerProfileId, followedProfileId);

        // Assert
        expect(result.message).toBe("Profile followed successfully");
        expect(result.followedAt).toEqual(createdFollow.createdAt);
        expect(mockFollowRepository.save).toHaveBeenCalled();
    });

    it("should throw SelfInteractionError when trying to follow the same profile", async () => {
        // Arrange
        const profileId = "123e4567-e89b-12d3-a456-426614174000";

        // Act & Assert
        expect(handler.handle(profileId, profileId))
            .rejects.toThrow(SelfInteractionError)
        expect(mockProfileRepository.findOneBy).not.toHaveBeenCalled();
    });

    it("should throw NotFoundError when follower profile does not exist", async () => {
        // Arrange
        const followerProfileId = "123e4567-e89b-12d3-a456-426614174000";
        const followedProfileId = "123e4567-e89b-12d3-a456-426614174001";

        mockProfileRepository.findOneBy = mock(() => Promise.resolve(null));

        // Act & Assert
        expect(handler.handle(followerProfileId, followedProfileId))
            .rejects.toThrow(NotFoundError);
    });

    it("should throw NotFoundError when followed profile does not exist", async () => {
        // Arrange
        const followerProfileId = "123e4567-e89b-12d3-a456-426614174000";
        const followedProfileId = "123e4567-e89b-12d3-a456-426614174001";
        
        const followerProfile = zocker(profileDto).generate();

        mockProfileRepository.findOneBy = mock(({ id }) => {
            if (id === followerProfileId) {
                return Promise.resolve(followerProfile);
            }
            return Promise.resolve(null);
        })

        // Act & Assert
        expect(handler.handle(followerProfileId, followedProfileId))
            .rejects.toThrow(NotFoundError);
    });

    it("should throw BlockedError when follower has blocked the followed profile", async () => {
        // Arrange
        const followerProfileId = "123e4567-e89b-12d3-a456-426614174000";
        const followedProfileId = "123e4567-e89b-12d3-a456-426614174001";
        
        const followerProfile = zocker(profileDto).generate();
        const followedProfile = zocker(profileDto).generate();

        const blockRecord = {
            id: "block-id",
            blockerProfile: followerProfile,
            blockedProfile: followedProfile,
            createdAt: new Date(),
            updatedAt: new Date()
        } as Block;

        mockProfileRepository.findOneBy = mock(({ id }) => {
            if (id === followerProfileId) {
                return Promise.resolve(followerProfile);
            }
            if (id === followedProfileId) {
                return Promise.resolve(followedProfile);
            }
            return Promise.resolve(null);
        });

        mockBlockRepository.findOne = mock(() => Promise.resolve(blockRecord));

        // Act & Assert
        expect(handler.handle(followerProfileId, followedProfileId))
            .rejects.toThrow(BlockedError);
    });

    it("should throw BlockedError when followed profile has blocked the follower", async () => {
        // Arrange
        const followerProfileId = "123e4567-e89b-12d3-a456-426614174000";
        const followedProfileId = "123e4567-e89b-12d3-a456-426614174001";
        
        const followerProfile = zocker(profileDto).generate();
        const followedProfile = zocker(profileDto).generate();

        const blockRecord = {
            id: "block-id",
            blockerProfile: followedProfile,
            blockedProfile: followerProfile,
            createdAt: new Date(),
            updatedAt: new Date()
        } as Block;

        mockProfileRepository.findOneBy = mock(({ id }) => {
            if (id === followerProfileId) {
                return Promise.resolve(followerProfile);
            }
            if (id === followedProfileId) {
                return Promise.resolve(followedProfile);
            }
            return Promise.resolve(null);
        });

        mockBlockRepository.findOne = mock()
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(blockRecord);

        // Act & Assert
        expect(handler.handle(followerProfileId, followedProfileId))
            .rejects.toThrow(BlockedError);
    });

    it("should return existing follow when already following", async () => {
        // Arrange
        const followerProfileId = "123e4567-e89b-12d3-a456-426614174000";
        const followedProfileId = "123e4567-e89b-12d3-a456-426614174001";
        
        const followerProfile = zocker(profileDto).generate();
        const followedProfile = zocker(profileDto).generate();
        const existingFollow = {
            id: "follow-id",
            followerProfile,
            followedProfile,
            createdAt: new Date("2024-01-01"),
            updatedAt: new Date("2024-01-01")
        } as Follow;

        mockProfileRepository.findOneBy = mock()
            .mockReturnValueOnce(Promise.resolve(followerProfile))
            .mockReturnValueOnce(Promise.resolve(followedProfile));

        mockBlockRepository.findOne = mock(() => Promise.resolve(null));
        mockFollowRepository.findOne = mock(() => Promise.resolve(existingFollow));

        // Act
        const result = await handler.handle(followerProfileId, followedProfileId);

        // Assert
        expect(result.message).toBe("Profile is already followed");
        expect(result.followedAt).toEqual(existingFollow.createdAt);
        expect(mockFollowRepository.save).not.toHaveBeenCalled();
    });
});
