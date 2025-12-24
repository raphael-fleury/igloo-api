import { Repository } from "typeorm";
import { ConflictError } from "@/app/errors";
import { appDataSource } from "@/database/data-source";
import { InteractionType, PostInteraction } from "@/database/entities/post-interaction";

export class UnlikePostHandler {
    constructor(private readonly postInteractionRepository: Repository<PostInteraction>) { }

    static get default() {
        return new UnlikePostHandler(appDataSource.getRepository(PostInteraction));
    }

    async handle(profileId: string, postId: string) {
        // Find the existing like
        const like = await this.postInteractionRepository.findOne({
            where: {
                profile: { id: profileId },
                post: { id: postId },
                interactionType: InteractionType.Like
            }
        });

        if (!like) {
            throw new ConflictError(`Like for this post not found`);
        }

        // Remove the like
        await this.postInteractionRepository.remove(like);
    }
}

