import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Repository } from "typeorm";
import { zocker } from "zocker";
import { GetAuthInfoHandler } from "../get-auth-info.handler";
import { UserDto, userDto } from "@/app/dtos/user.dtos";
import { ProfileDto, profileDto } from "@/app/dtos/profile.dtos";
import { tokenPayloadDto } from "@/app/dtos/auth.dtos";
import { idDto } from "@/app/dtos/common.dtos";
import { UnauthorizedError } from "@/app/errors";
import { User } from "@/database/entities/user";
import { Profile } from "@/database/entities/profile";
import { UserProfile } from "@/database/entities/user-profile";

describe("GetAuthInfoHandler", () => {
    let handler: GetAuthInfoHandler;
    let mockUserRepository: Repository<User>;
    let mockUserProfileRepository: Repository<UserProfile>;

    beforeEach(() => {
        mockUserRepository = {
            findOneBy: mock(() => Promise.resolve(null)),
        } as any;
        mockUserProfileRepository = {
            findOne: mock(() => Promise.resolve(null)),
        } as any;

        handler = new GetAuthInfoHandler(
            mockUserRepository,
            mockUserProfileRepository
        );
    });

    it("should return user and profile when profileId is present", async () => {
        // Arrange
        const payload = zocker(tokenPayloadDto).generate();
        const mockUser = zocker(userDto).generate() as User;
        const mockProfile = zocker(profileDto).generate() as Profile;
        const mockUserProfile = {
            id: "rel-1",
            user: mockUser,
            profile: mockProfile,
            createdAt: new Date(),
            updatedAt: new Date()
        } as UserProfile;

        mockUserProfileRepository.findOne = mock(() => Promise.resolve(mockUserProfile));

        // Act
        const result = await handler.handle(payload);

        // Assert
        expect(result.user).toEqual(mockUser as UserDto);
        expect(result.profile).toEqual(mockProfile as ProfileDto);
        expect(mockUserProfileRepository.findOne).toHaveBeenCalledWith({
            where: {
                user: { id: payload.userId },
                profile: { id: payload.profileId }
            },
            relations: {
                user: true,
                profile: true
            }
        });
    });

    it("should return only user when profileId is empty", async () => {
        // Arrange
        const payload = {
            userId: zocker(idDto).generate(),
        }
        const mockUser = zocker(userDto).generate() as User;

        mockUserRepository.findOneBy = mock(() => Promise.resolve(mockUser));

        // Act
        const result = await handler.handle(payload);

        // Assert
        expect(result.user).toEqual(mockUser);
        expect(result.profile).toBeUndefined();
        expect(mockUserRepository.findOneBy).toHaveBeenCalledWith({ id: payload.userId });
        expect(mockUserProfileRepository.findOne).not.toHaveBeenCalled();
    });

    it("should throw UnauthorizedError when user does not exists and profileId empty", async () => {
        // Arrange
        const payload = {
            userId: zocker(idDto).generate(),
        }
        mockUserRepository.findOneBy = mock(() => Promise.resolve(null));

        // Act & Assert
        expect(handler.handle(payload)).rejects.toThrow(UnauthorizedError);
        expect(mockUserProfileRepository.findOne).not.toHaveBeenCalled();
    });

    it("should throw UnauthorizedError when UserProfile relation does not exists", async () => {
        // Arrange
        const payload = zocker(tokenPayloadDto).generate();
        mockUserProfileRepository.findOne = mock(() => Promise.resolve(null));

        // Act & Assert
        expect(handler.handle(payload)).rejects.toThrow(UnauthorizedError);
        expect(mockUserRepository.findOneBy).not.toHaveBeenCalled();
    });
})
