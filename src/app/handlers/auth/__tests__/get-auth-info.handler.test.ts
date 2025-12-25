import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Repository } from "typeorm";
import { zocker } from "zocker";
import { GetAuthInfoHandler } from "../get-auth-info.handler";
import { User } from "@/database/entities/user";
import { Profile } from "@/database/entities/profile";
import { UserProfile } from "@/database/entities/user-profile";
import { NotFoundError, UnauthorizedError } from "@/app/errors";
import { userDto } from "@/app/dtos/user.dtos";
import { profileDto } from "@/app/dtos/profile.dtos";
import { tokenPayloadDto } from "@/app/dtos/auth.dtos";

describe("GetAuthInfoHandler", () => {
    let handler: GetAuthInfoHandler;
    let mockUserRepository: Repository<User>;
    let mockProfileRepository: Repository<Profile>;
    let mockUserProfileRepository: Repository<UserProfile>;

    beforeEach(() => {
        mockUserRepository = {
            findOneBy: mock(() => Promise.resolve(null)),
        } as any;
        mockProfileRepository = {
            findOneBy: mock(() => Promise.resolve(null)),
        } as any;
        mockUserProfileRepository = {
            findOne: mock(() => Promise.resolve(null)),
        } as any;

        handler = new GetAuthInfoHandler(
            mockUserRepository,
            mockProfileRepository,
            mockUserProfileRepository
        );
    });

    it("should return user and profile when profileId is present", async () => {
        // Arrange
        const payload = zocker(tokenPayloadDto).generate();
        const mockUser = zocker(userDto).generate() as any as User;
        const mockProfile = zocker(profileDto).generate() as any as Profile;
        const mockUserProfile = {
            id: "rel-1",
            user: mockUser,
            profile: mockProfile,
            createdAt: new Date(),
            updatedAt: new Date()
        } as UserProfile;

        mockUserRepository.findOneBy = mock(() => Promise.resolve(mockUser));
        mockProfileRepository.findOneBy = mock(() => Promise.resolve(mockProfile));
        mockUserProfileRepository.findOne = mock(() => Promise.resolve(mockUserProfile));

        // Act
        const result = await handler.handle(payload);

        // Assert
        expect(result.user).toEqual(userDto.parse(mockUser));
        expect(result.profile).toEqual(profileDto.parse(mockProfile));
        expect(mockUserRepository.findOneBy).toHaveBeenCalledWith({ id: payload.userId });
        expect(mockProfileRepository.findOneBy).toHaveBeenCalledWith({ id: payload.profileId });
        expect(mockUserProfileRepository.findOne).toHaveBeenCalledWith({
            where: {
                user: { id: payload.userId },
                profile: { id: payload.profileId }
            },
            relations: { profile: true }
        });
    });

    it("should return only user when profileId is empty", async () => {
        // Arrange
        const payload = zocker(tokenPayloadDto).generate();
        payload.profileId = undefined;
        const mockUser = zocker(userDto).generate() as any as User;
        mockUserRepository.findOneBy = mock(() => Promise.resolve(mockUser));

        // Act
        const result = await handler.handle(payload);

        // Assert
        expect(result.user).toEqual(userDto.parse(mockUser));
        expect((result as any).profile).toBeUndefined();
        expect(mockUserRepository.findOneBy).toHaveBeenCalledWith({ id: payload.userId });
        expect(mockProfileRepository.findOneBy).not.toHaveBeenCalled();
        expect(mockUserProfileRepository.findOne).not.toHaveBeenCalled();
    });

    it("should throw NotFoundError when user does not exists", async () => {
        // Arrange
        const payload = zocker(tokenPayloadDto).generate();
        mockUserRepository.findOneBy = mock(() => Promise.resolve(null));

        // Act & Assert
        expect(handler.handle(payload)).rejects.toThrow(NotFoundError);
        expect(handler.handle(payload)).rejects.toThrow("User not found");
    });

    it("should throw NotFoundError when profile does not exists", async () => {
        // Arrange
        const payload = zocker(tokenPayloadDto).generate();
        const mockUser = zocker(userDto).generate() as any as User;
        mockUserRepository.findOneBy = mock(() => Promise.resolve(mockUser));
        mockProfileRepository.findOneBy = mock(() => Promise.resolve(null));

        // Act & Assert
        expect(handler.handle(payload)).rejects.toThrow(NotFoundError);
        expect(handler.handle(payload)).rejects.toThrow("Profile not found");
    });

    it("should throw UnauthorizedError when UserProfile relation does not exists", async () => {
        // Arrange
        const payload = zocker(tokenPayloadDto).generate();
        const mockUser = zocker(userDto).generate() as any as User;
        const mockProfile = zocker(profileDto).generate() as any as Profile;
        mockUserRepository.findOneBy = mock(() => Promise.resolve(mockUser));
        mockProfileRepository.findOneBy = mock(() => Promise.resolve(mockProfile));
        mockUserProfileRepository.findOne = mock(() => Promise.resolve(null));

        // Act & Assert
        expect(handler.handle(payload)).rejects.toThrow(UnauthorizedError);
        expect(handler.handle(payload)).rejects.toThrow("User does not have access to this profile");
    });
})
