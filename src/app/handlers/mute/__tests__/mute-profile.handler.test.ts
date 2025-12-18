import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Repository } from "typeorm";
import { zocker } from "zocker";
import { MuteProfileHandler } from "../mute-profile.handler";
import { Mute } from "@/database/entities/mute";
import { Profile } from "@/database/entities/profile";
import { NotFoundError } from "@/app/errors";
import { profileDto } from "@/app/dtos/profile.dtos";

describe("MuteProfileHandler", () => {
    let handler: MuteProfileHandler;
    let mockMuteRepository: Repository<Mute>;
    let mockProfileRepository: Repository<Profile>;

    beforeEach(() => {
        mockMuteRepository = {
            findOne: mock(() => Promise.resolve(null)),
            create: mock(data => data),
            save: mock(data => Promise.resolve(data))
        } as any;

        mockProfileRepository = {
            findOneBy: mock(() => Promise.resolve(null))
        } as any;

        handler = new MuteProfileHandler(mockMuteRepository, mockProfileRepository);
    });

    it("should mute profile successfully when both profiles exist", async () => {
        // Arrange
        const muterProfileId = "123e4567-e89b-12d3-a456-426614174000";
        const mutedProfileId = "123e4567-e89b-12d3-a456-426614174001";
        
        const muterProfile = zocker(profileDto).generate();
        const mutedProfile = zocker(profileDto).generate();

        const createdMute = {
            id: "mute-id",
            muterProfile,
            mutedProfile,
            createdAt: new Date(),
            updatedAt: new Date()
        } as Mute;

        mockProfileRepository.findOneBy = mock()
            .mockReturnValueOnce(Promise.resolve(muterProfile))
            .mockReturnValueOnce(Promise.resolve(mutedProfile));

        mockMuteRepository.findOne = mock(() => Promise.resolve(null));
        mockMuteRepository.save = mock(() => Promise.resolve(createdMute)) as any;

        // Act
        const result = await handler.handle(muterProfileId, mutedProfileId);

        // Assert
        expect(result.message).toBe("Profile muted successfully");
        expect(result.mutedAt).toEqual(createdMute.createdAt);
        expect(mockMuteRepository.save).toHaveBeenCalled();
    });

    it("should throw NotFoundError when muter profile does not exist", async () => {
        // Arrange
        const muterProfileId = "123e4567-e89b-12d3-a456-426614174000";
        const mutedProfileId = "123e4567-e89b-12d3-a456-426614174001";

        mockProfileRepository.findOneBy = mock(() => Promise.resolve(null));

        // Act & Assert
        expect(handler.handle(muterProfileId, mutedProfileId)).rejects.toThrow(NotFoundError);
        expect(handler.handle(muterProfileId, mutedProfileId)).rejects.toThrow(
            `Muter profile with id ${muterProfileId} not found`
        );
    });

    it("should throw NotFoundError when muted profile does not exist", async () => {
        // Arrange
        const muterProfileId = "123e4567-e89b-12d3-a456-426614174000";
        const mutedProfileId = "123e4567-e89b-12d3-a456-426614174001";
        
        const muterProfile = zocker(profileDto).generate();

        mockProfileRepository.findOneBy = mock(({ id }) => {
            if (id === muterProfileId) {
                return Promise.resolve(muterProfile);
            }
            return Promise.resolve(null);
        })

        // Act & Assert
        expect(handler.handle(muterProfileId, mutedProfileId)).rejects.toThrow(NotFoundError);
        expect(handler.handle(muterProfileId, mutedProfileId)).rejects.toThrow(
            `Muted profile with id ${mutedProfileId} not found`
        );
    });

    it("should return existing mute when already muted", async () => {
        // Arrange
        const muterProfileId = "123e4567-e89b-12d3-a456-426614174000";
        const mutedProfileId = "123e4567-e89b-12d3-a456-426614174001";
        
        const muterProfile = zocker(profileDto).generate();
        const mutedProfile = zocker(profileDto).generate();
        const existingMute = {
            id: "mute-id",
            muterProfile,
            mutedProfile,
            createdAt: new Date("2024-01-01"),
            updatedAt: new Date("2024-01-01")
        } as Mute;

        mockProfileRepository.findOneBy = mock()
            .mockReturnValueOnce(Promise.resolve(muterProfile))
            .mockReturnValueOnce(Promise.resolve(mutedProfile));

        mockMuteRepository.findOne = mock(() => Promise.resolve(existingMute));

        // Act
        const result = await handler.handle(muterProfileId, mutedProfileId);

        // Assert
        expect(result.message).toBe("Profile is already muted");
        expect(result.mutedAt).toEqual(existingMute.createdAt);
        expect(mockMuteRepository.save).not.toHaveBeenCalled();
    });
});
