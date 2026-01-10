import { SelectQueryBuilder } from "typeorm";
import { ProfileInteraction, ProfileInteractionType } from "../entities/profile-interaction";

export function getProfileInteractionsBySource(
    sourceProfileId: string,
    interactionType: ProfileInteractionType,
    cursor?: string
) {
    return (qb: SelectQueryBuilder<ProfileInteraction>) => {
        const queryBuilder = qb
            .leftJoinAndSelect("interaction.targetProfile", "profile")
            .where("interaction.sourceProfile.id = :sourceProfileId", { sourceProfileId })
            .andWhere("interaction.interactionType = :type", { type: interactionType })
            .orderBy("interaction.id", "DESC");

        if (cursor) {
            queryBuilder.andWhere("interaction.id < :cursor", { cursor });
        }

        return queryBuilder;
    }
}

export function getProfileInteractionsByTarget(
    targetProfileId: string,
    interactionType: ProfileInteractionType,
    cursor?: string
) {
    return (qb: SelectQueryBuilder<ProfileInteraction>) => {
        const queryBuilder = qb
            .leftJoinAndSelect("interaction.sourceProfile", "profile")
            .where("interaction.targetProfile.id = :targetProfileId", { targetProfileId })
            .andWhere("interaction.interactionType = :type", { type: interactionType })
            .orderBy("interaction.id", "DESC");

        if (cursor) {
            queryBuilder.andWhere("interaction.id < :cursor", { cursor });
        }

        return queryBuilder;
    }
}

