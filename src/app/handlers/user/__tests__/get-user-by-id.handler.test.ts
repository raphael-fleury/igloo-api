import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Repository } from "typeorm";
import { zocker } from "zocker";
import { GetUserByIdHandler } from "../get-user-by-id.handler";
import { User } from "@/database/entities/user";
import { NotFoundError } from "@/app/errors";
import { userDto } from "@/app/dtos/user.dtos";
import { idDto } from "@/app/dtos/common.dtos";

describe("GetUserByIdHandler", () => {
    let handler: GetUserByIdHandler;
    let mockRepository: Repository<User>;

    beforeEach(() => {
        mockRepository = {
            findOneBy: mock(() => Promise.resolve(null))
        } as any;
        handler = new GetUserByIdHandler(mockRepository);
    });

    it("should return user when user exists", async () => {
        // Arrange
        const user = zocker(userDto).generate();
        mockRepository.findOneBy = mock(() => Promise.resolve(user as User));

        // Act
        const result = await handler.handle({ id: user.id });

        // Assert
        expect(result).toEqual(user);
    });

    it("should throw NotFoundError when user does not exist", async () => {
        // Arrange
        const userId = zocker(idDto).generate();
        mockRepository.findOneBy = mock(() => Promise.resolve(null));

        // Act & Assert
        expect(handler.handle({ id: userId })).rejects.toThrow(NotFoundError);
        expect(handler.handle({ id: userId })).rejects.toThrow(`User with id ${userId} not found`);
    });
});
