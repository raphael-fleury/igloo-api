import z from "zod";

export const idDto = z.uuid();

export const pageQueryDto = z.object({
    cursor: idDto.optional(),
    limit: z.int().positive().optional()
})

export const pageDto = z.object({
    hasNextPage: z.boolean(),
    nextCursor: idDto.optional(),
    count: z.int()
})

export type PageQueryDto = z.infer<typeof pageQueryDto>;
export type PageDto = z.infer<typeof pageDto>;