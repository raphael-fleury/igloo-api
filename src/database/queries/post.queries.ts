import { QueryBuilder } from "typeorm";
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