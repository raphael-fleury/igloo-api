import { SelectQueryBuilder, ObjectLiteral } from "typeorm";

declare module "typeorm" {
    interface SelectQueryBuilder<Entity extends ObjectLiteral> {
        /**
         * Applies a transformation to the query builder and returns it with the applied methods.
         * Useful for applying query functions in a composable way.
         * 
         * @example
         * ```typescript
         * const qb = repository.createQueryBuilder("entity")
         *     .apply(qb => getProfileInteractionsBySource(qb, profileId, type, cursor))
         *     .take(10);
         * ```
         */
        apply<T extends SelectQueryBuilder<Entity>>(
            fn: (qb: SelectQueryBuilder<Entity>) => T
        ): T;
    }
}

SelectQueryBuilder.prototype.apply = function <Entity extends ObjectLiteral, T extends SelectQueryBuilder<Entity>>(
    this: SelectQueryBuilder<Entity>,
    fn: (qb: SelectQueryBuilder<Entity>) => T
): T {
    return fn(this);
};

