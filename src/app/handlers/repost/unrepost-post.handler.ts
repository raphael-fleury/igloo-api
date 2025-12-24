import { Repository } from "typeorm";
import { ConflictError } from "@/app/errors";
import { appDataSource } from "@/database/data-source";
import { InteractionType, PostInteraction } from "@/database/entities/post-interaction";

export class UnrepostPostHandler {
    constructor(private readonly postInteractionRepository: Repository<PostInteraction>) { }

    static get default() {
        return new UnrepostPostHandler(appDataSource.getRepository(PostInteraction));
    }

    async handle(profileId: string, postId: string) {
        // Find the existing repost
        const repost = await this.postInteractionRepository.findOne({
            where: {
                profile: { id: profileId },
                post: { id: postId },
                interactionType: InteractionType.Repost
            }
        });

        if (!repost) {
            throw new ConflictError(`Repost for this post not found`);
        }

        // Remove the repost
        await this.postInteractionRepository.remove(repost);

        return {
            message: "Post unreposted successfully",
            unrepostedAt: new Date()
        };
    }
}

