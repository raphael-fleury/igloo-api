import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Repository } from "typeorm";
import { zocker } from "zocker";
import { GetProfilesHandler } from "../get-profiles.handler";
import { Profile } from "@/database/entities/profile";
import { profileDto } from "@/app/dtos/profile.dtos";

describe("GetProfilesHandler", () => {
    let handler: GetProfilesHandler;
    let mockRepository: Repository<Profile>;

    beforeEach(() => {
        mockRepository = {
            find: mock(() => Promise.resolve([])),
        } as any;
        handler = new GetProfilesHandler(mockRepository);
    });

    it("should return array of profiles", async () => {
        // Arrange
        const mockProfile1 = zocker(profileDto).generate();
        const mockProfile2 = zocker(profileDto).generate();
        const mockProfiles = [mockProfile1, mockProfile2] as Profile[];
        mockRepository.find = mock(() => Promise.resolve(mockProfiles));

        // Act
        const result = await handler.handle();

        // Assert
        expect(result).toHaveLength(2);
        expect(result[0]).toEqual(mockProfile1);
        expect(result[1]).toEqual(mockProfile2);
        expect(mockRepository.find).toHaveBeenCalledTimes(1);
    });
});
