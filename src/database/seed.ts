import "reflect-metadata";
import { appDataSource } from "./data-source";
import { User } from "./entities/user";
import { Profile } from "./entities/profile";
import { UserProfile } from "./entities/user-profile";
import { Post } from "./entities/post";
import { PostInteraction, InteractionType } from "./entities/post-interaction";
import { ProfileInteraction, ProfileInteractionType } from "./entities/profile-interaction";
import { PasswordHashService } from "@/app/services/password-hash.service";

async function main() {
    await appDataSource.initialize();
    const passwordService = new PasswordHashService();

    const userRepo = appDataSource.getRepository(User);
    const profileRepo = appDataSource.getRepository(Profile);
    const userProfileRepo = appDataSource.getRepository(UserProfile);
    const postRepo = appDataSource.getRepository(Post);
    const postInteractionRepo = appDataSource.getRepository(PostInteraction);
    const profileInteractionRepo = appDataSource.getRepository(ProfileInteraction);

    const users = [
        { email: "alice@example.com", phone: "11111111111", passwordHash: await passwordService.hash("alicepass") },
        { email: "bob@example.com", phone: "22222222222", passwordHash: await passwordService.hash("bobpass") },
        { email: "charlie@example.com", phone: "33333333333", passwordHash: await passwordService.hash("charliepass") },
    ].map(data => userRepo.create({ ...data }));
    const savedUsers = await userRepo.save(users);

    const profiles = [
        { username: "alice", displayName: "Alice", bio: "Hello from Alice" },
        { username: "bob", displayName: "Bob", bio: "Bob here" },
        { username: "charlie", displayName: "Charlie", bio: "Charlie chilling" },
    ].map(data => profileRepo.create({ ...data }));
    const savedProfiles = await profileRepo.save(profiles);

    await userProfileRepo.save(savedUsers.map((u, i) => userProfileRepo.create({
        user: u,
        profile: savedProfiles[i]
    })));

    const [alice, bob, charlie] = savedProfiles;
    const [aliceUser, bobUser, charlieUser] = savedUsers;

    const alicePost1 = await postRepo.save(postRepo.create({
        user: aliceUser,
        profile: alice,
        content: "Alice's first post"
    }));

    const alicePost2 = await postRepo.save(postRepo.create({
        user: aliceUser,
        profile: alice,
        content: "Replying to myself",
        repliedPost: alicePost1
    }));

    const bobPost1 = await postRepo.save(postRepo.create({
        user: bobUser,
        profile: bob,
        content: "Bob says hi"
    }));

    const bobPost2 = await postRepo.save(postRepo.create({
        user: bobUser,
        profile: bob,
        content: "Quoting Alice",
        quotedPost: alicePost1
    }));

    const charliePost1 = await postRepo.save(postRepo.create({
        user: charlieUser,
        profile: charlie,
        content: "Charlie here"
    }));

    await profileInteractionRepo.save([
        profileInteractionRepo.create({ sourceProfile: alice, targetProfile: bob, interactionType: ProfileInteractionType.Follow }),
        profileInteractionRepo.create({ sourceProfile: bob, targetProfile: alice, interactionType: ProfileInteractionType.Follow }),
        profileInteractionRepo.create({ sourceProfile: charlie, targetProfile: bob, interactionType: ProfileInteractionType.Block }),
        profileInteractionRepo.create({ sourceProfile: alice, targetProfile: charlie, interactionType: ProfileInteractionType.Mute }),
    ]);

    await postInteractionRepo.save([
        postInteractionRepo.create({ user: aliceUser, profile: alice, post: bobPost1, interactionType: InteractionType.Like }),
        postInteractionRepo.create({ user: bobUser, profile: bob, post: alicePost1, interactionType: InteractionType.Repost }),
    ]);

    console.log("Seed complete", {
        users: savedUsers.length,
        profiles: savedProfiles.length
    });

    await appDataSource.destroy();
}

main().catch(async (err) => {
    console.error(err);
    try { await appDataSource.destroy(); } catch {}
    process.exit(1);
});
