import { Repository } from "typeorm";
import { CreatePostDto, postDto } from "@/app/dtos/post.dtos";
import { NotFoundError } from "@/app/errors";
import { appDataSource } from "@/database/data-source";
import { Post } from "@/database/entities/post";
import { User } from "@/database/entities/user";
import { Profile } from "@/database/entities/profile";

export class CreatePostHandler {
    constructor(
        private readonly postRepository: Repository<Post>,
        private readonly userRepository: Repository<User>,
        private readonly profileRepository: Repository<Profile>
    ) { }

    static get default() {
        return new CreatePostHandler(
            appDataSource.getRepository(Post),
            appDataSource.getRepository(User),
            appDataSource.getRepository(Profile)
        );
    }

    async handle(data: CreatePostDto) {
        // Validations
        const user = await this.userRepository.findOneBy({ id: data.userId });
        if (!user) {
            throw new NotFoundError(`User with id ${data.userId} not found`);
        }

        const profile = await this.profileRepository.findOneBy({ id: data.profileId });
        if (!profile) {
            throw new NotFoundError(`Profile with id ${data.profileId} not found`);
        }

        let replyToPost = null;
        if (data.replyToPostId) {
            replyToPost = await this.postRepository.findOneBy({ id: data.replyToPostId });
            if (!replyToPost) {
                throw new NotFoundError(`Post with id ${data.replyToPostId} not found`);
            }
        }

        // Creation
        const post = this.postRepository.create({
            user,
            profile,
            content: data.content,
            replyToPost: replyToPost || undefined
        });

        const savedPost = await this.postRepository.save(post);

        return postDto.parse(savedPost);
    }
}
