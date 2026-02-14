import { Repository } from "typeorm";
import { Mention } from "@/database/entities/mention";
import { Post } from "@/database/entities/post";
import { Profile } from "@/database/entities/profile";
import { appDataSource } from "@/database/data-source";

export class MentionService {
    constructor(
        private readonly mentionRepository: Repository<Mention>,
        private readonly profileRepository: Repository<Profile>
    ) {}

    static get default() {
        return new MentionService(
            appDataSource.getRepository(Mention),
            appDataSource.getRepository(Profile)
        );
    }

    /**
     * Extracts usernames mentioned in text (format: @username)
     */
    private extractMentionedUsernames(content: string): string[] {
        const mentionRegex = /@(\w+)/g;
        const mentions: string[] = [];
        let match;

        while ((match = mentionRegex.exec(content)) !== null) {
            mentions.push(match[1]);
        }

        return [...new Set(mentions)]; // Remove duplicates
    }

    /**
     * Creates mentions for a post based on the content text
     * This runs asynchronously without blocking the main flow
     */
    async createMentionsForPost(post: Post, content: string): Promise<void> {
        try {
            const mentionedUsernames = this.extractMentionedUsernames(content);

            if (mentionedUsernames.length === 0) {
                return;
            }

            // Find all profiles matching the mentioned usernames
            const mentionedProfiles = await this.profileRepository.find({
                where: mentionedUsernames.map(username => ({ username }))
            });

            if (mentionedProfiles.length === 0) {
                return;
            }

            // Create mention entities
            const mentions = mentionedProfiles.map(profile => {
                return this.mentionRepository.create({
                    post,
                    mentionedProfile: profile,
                    usernameAtMention: profile.username
                });
            });

            await this.mentionRepository.save(mentions);
        } catch (error) {
            // Log error but don't throw to prevent post creation from failing
            console.error("Error creating mentions for post:", error);
        }
    }
}
