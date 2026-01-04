import z from "zod";

export const idDto = z.uuid();

export const pageQueryDto = z.object({
    cursor: idDto.optional(),
    limit: z.int().positive().max(20).optional().default(10)
})

export const pageDto = z.object({
    hasNextPage: z.boolean(),
    nextCursor: idDto.optional(),
    count: z.int()
})