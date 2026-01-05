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
        const sourceProfileId = zocker(idDto).generate();
        const targetProfile = zocker(profileDto).generate();
        const mute = {
            id: "mute-id-1",
            sourceProfile: { id: sourceProfileId },
            targetProfile: targetProfile,
            interactionType: ProfileInteractionType.Mute,
            createdAt: new Date(),
            updatedAt: new Date()
        } as ProfileInteraction;

        mockProfileInteractionRepository.find = mock(() => Promise.resolve([mute]));

        // Act
        const result = await handler.handle({ sourceProfileId });

        // Assert
        expect(result.total).toBe(1);
        expect(result.profiles).toHaveLength(1);
        expect(result.profiles[0].username).toBe(targetProfile.username);
        expect(result.profiles[0].mutedAt).toEqual(mute.createdAt);
        expect(mockProfileInteractionRepository.find).toHaveBeenCalledWith({
            where: {
                sourceProfile: { id: sourceProfileId },
                interactionType: ProfileInteractionType.Mute
            },
            relations: ["targetProfile"],
            order: {
                createdAt: "DESC"
            }
        });
    });
});
