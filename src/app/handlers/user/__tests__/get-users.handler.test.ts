import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Repository } from "typeorm";
import { zocker } from "zocker";
import { GetUsersHandler } from "../get-users.handler";
import { User } from "@/database/entities/user";
import { userDto } from "@/app/dtos/user.dtos";

describe("GetUsersHandler", () => {
    let handler: GetUsersHandler;
    let mockRepository: Repository<User>;

    beforeEach(() => {
        mockRepository = {
            find: mock(() => Promise.resolve([])),
        } as any;
        handler = new GetUsersHandler(mockRepository);
    });

    it("should return array of users", async () => {
        // Arrange
        const mockUser1 = zocker(userDto).generate();
        const mockUser2 = zocker(userDto).generate();
        const mockUsers = [mockUser1, mockUser2] as User[];
        mockRepository.find = mock(() => Promise.resolve(mockUsers));

        // Act
        const result = await handler.handle();

        // Assert
        expect(result).toHaveLength(2);
        expect(result[0]).toEqual(mockUser1);
        expect(result[1]).toEqual(mockUser2);
        expect(mockRepository.find).toHaveBeenCalledTimes(1);
    });
});
