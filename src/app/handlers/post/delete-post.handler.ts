import { Repository } from "typeorm";
import { NotFoundError, UnauthorizedError } from "@/app/errors";
import { appDataSource } from "@/database/data-source";
import { Post } from "@/database/entities/post";
import { CommandHandler } from "@/app/cqrs";

type DeletePostCommand = {
    id: string;
    profileId: string;
}

export class DeletePostHandler implements CommandHandler<DeletePostCommand, { message: string, deletedAt: Date }> {
    constructor(private readonly postRepository: Repository<Post>) { }

    static get default() {
        return new DeletePostHandler(appDataSource.getRepository(Post));
    }

    async handle({ id, profileId }: DeletePostCommand) {
        const post = await this.postRepository.findOneBy({ id });
        
        if (!post) {
            throw new NotFoundError(`Post with id ${id} not found`);
        }

        if (post.profile.id !== profileId) {
            throw new UnauthorizedError("You can only delete your own posts");
        }

        await this.postRepository.remove(post);

        return {
            message: "Post deleted successfully",
            deletedAt: new Date()
        };
    }
}
