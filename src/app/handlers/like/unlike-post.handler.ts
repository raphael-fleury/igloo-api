import { Repository } from "typeorm";
import { NotFoundError } from "@/app/errors";
import { appDataSource } from "@/database/data-source";
import { Like } from "@/database/entities/like";

export class UnlikePostHandler {
    constructor(private readonly likeRepository: Repository<Like>) { }

    static get default() {
        return new UnlikePostHandler(appDataSource.getRepository(Like));
    }

    async handle(profileId: string, postId: string) {
        // Find the existing like
        const like = await this.likeRepository.findOne({
            where: {
                profile: { id: profileId },
                post: { id: postId }
            }
        });

        if (!like) {
            throw new NotFoundError(`Like for this post not found`);
        }

        // Remove the like
        await this.likeRepository.remove(like);

        return {
            message: "Post unliked successfully",
            unlikedAt: new Date()
        };
    }
}

