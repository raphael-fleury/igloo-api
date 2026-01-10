import { QueryBuilder, SelectQueryBuilder } from "typeorm";
import { PostQueryDto } from "@/app/dtos/post.dtos";
import { Post } from "../entities/post";
import { PostInteraction, InteractionType } from "../entities/post-interaction";

export function countPostReplies(qb: QueryBuilder<Post>) {
    return qb
        .select("COUNT(*)")
        .from(Post, "p")
        .where("p.replied_post_id = post.id");
}

export function countPostQuotes(qb: QueryBuilder<Post>) {
    return qb
        .select("COUNT(*)")
        .from(Post, "p")
        .where("p.quoted_post_id = post.id");
}

export function countPostLikes(qb: QueryBuilder<Post>) {
    return qb
        .select("COUNT(*)")
        .from(PostInteraction, "i")
        .where("i.post_id = post.id")
        .andWhere("i.interaction_type = :type", { type: InteractionType.Like });
}

export function countPostReposts(qb: QueryBuilder<Post>) {
    return qb
        .select("COUNT(*)")
        .from(PostInteraction, "i")
        .where("i.post_id = post.id")
        .andWhere("i.interaction_type = :type", { type: InteractionType.Repost });
}

export function findPosts(query: PostQueryDto) {
    return (qb: SelectQueryBuilder<Post>) => {
        const queryBuilder = qb
            .leftJoinAndSelect("post.profile", "profile")

            // Replied post + profile
            .leftJoinAndSelect("post.repliedPost", "repliedPost")
            .leftJoinAndSelect("repliedPost.profile", "repliedProfile")

            // Quoted post + profile
            .leftJoinAndSelect("post.quotedPost", "quotedPost")
            .leftJoinAndSelect("quotedPost.profile", "quotedProfile")

            // Replies & Quotes count
            .addSelect(countPostReplies, "replies")
            .addSelect(countPostQuotes, "quotes")
            .addSelect(countPostLikes, "likes")
            .addSelect(countPostReposts, "reposts")

            .orderBy("post.id", "DESC");

        if (query.content) {
            qb.andWhere("post.content ILIKE :content", { content: `%${query.content}%` });
        }

        if (query.from) {
            qb.andWhere("profile.username = :from", { from: query.from });
        }

        if (query.since) {
            qb.andWhere("post.created_at >= :since", { since: query.since });
        }

        if (query.until) {
            qb.andWhere("post.created_at <= :until", { until: query.until });
        }

        if (query.repliedPostId) {
            qb.andWhere("repliedPost.id = :repliedPostId", { repliedPostId: query.repliedPostId });
        }

        if (query.repliedProfileUsername) {
            qb.andWhere("repliedProfile.username = :repliedProfileUsername", {
                repliedProfileUsername: query.repliedProfileUsername
            });
        }

        if (query.quotedPostId) {
            qb.andWhere("quotedPost.id = :quotedPostId", { quotedPostId: query.quotedPostId });
        }

        if (query.quotedProfileUsername) {
            qb.andWhere("quotedProfile.username = :quotedProfileUsername", {
                quotedProfileUsername: query.quotedProfileUsername
            });
        }

        if (query.cursor) {
            qb.andWhere("post.id < :cursor", { cursor: query.cursor });
        }

        return queryBuilder;
    }
}

export function getPostById(id: string) {
    return (qb: SelectQueryBuilder<Post>) => {
        return qb
            .leftJoinAndSelect("post.profile", "profile")

            // Replied post + profile
            .leftJoinAndSelect("post.repliedPost", "repliedPost")
            .leftJoinAndSelect("repliedPost.profile", "repliedProfile")

            // Quoted post + profile
            .leftJoinAndSelect("post.quotedPost", "quotedPost")
            .leftJoinAndSelect("quotedPost.profile", "quotedProfile")

            // Replies & Quotes count
            .addSelect(countPostReplies, "replies")
            .addSelect(countPostQuotes, "quotes")
            .addSelect(countPostLikes, "likes")
            .addSelect(countPostReposts, "reposts")

            .where("post.id = :id", { id })

            .groupBy("post.id")
            .addGroupBy("profile.id")
            .addGroupBy("repliedPost.id")
            .addGroupBy("repliedProfile.id")
            .addGroupBy("quotedPost.id")
            .addGroupBy("quotedProfile.id");
    }
}