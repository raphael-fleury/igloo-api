import { LoginHandler } from "../handlers/auth/login.handler";
import { BlockProfileHandler } from "../handlers/block/block-profile.handler";
import { GetBlockedProfilesHandler } from "../handlers/block/get-blocked-profiles.handler";
import { UnblockProfileHandler } from "../handlers/block/unblock-profile.handler";
import { FollowProfileHandler } from "../handlers/follow/follow-profile.handler";
import { GetFollowersHandler } from "../handlers/follow/get-followers.handler";
import { GetFollowingHandler } from "../handlers/follow/get-following.handler";
import { UnfollowProfileHandler } from "../handlers/follow/unfollow-profile.handler";
import { LikePostHandler } from "../handlers/like/like-post.handler";
import { GetPostLikesHandler } from "../handlers/like/get-post-likes.handler";
import { UnlikePostHandler } from "../handlers/like/unlike-post.handler";
import { GetMutedProfilesHandler } from "../handlers/mute/get-muted-profiles.handler";
import { MuteProfileHandler } from "../handlers/mute/mute-profile.handler";
import { UnmuteProfileHandler } from "../handlers/mute/unmute-profile.handler";
import { CreatePostHandler } from "../handlers/post/create-post.handler";
import { DeletePostHandler } from "../handlers/post/delete-post.handler";
import { FindPostsHandler } from "../handlers/post/find-posts.handler";
import { GetPostByIdHandler } from "../handlers/post/get-post-by-id.handler";
import { GetPostRepliesHandler } from "../handlers/post/get-post-replies.handler";
import { GetPostQuotesHandler } from "../handlers/post/get-post-quotes.handler";
import { GetFollowingFeedHandler } from "../handlers/feed/get-following-feed.handler";
import { GetTrendingFeedHandler } from "../handlers/feed/get-trending-feed.handler";
import { GetNotificationsHandler } from "../handlers/notification/get-notifications.handler";
import { MarkNotificationsAsReadHandler } from "../handlers/notification/mark-notifications-as-read.handler";
import { GetProfileByIdHandler } from "../handlers/profile/get-profile-by-id.handler";
import { UpdateProfileHandler } from "../handlers/profile/update-profile.handler";
import { UploadAvatarHandler } from "../handlers/profile/upload-avatar.handler";
import { DeleteAvatarHandler } from "../handlers/profile/delete-avatar.handler";
import { UploadHeaderHandler } from "../handlers/profile/upload-header.handler";
import { DeleteHeaderHandler } from "../handlers/profile/delete-header.handler";
import { GetPostRepostsHandler } from "../handlers/repost/get-post-reposts.handler";
import { RepostPostHandler } from "../handlers/repost/repost-post.handler";
import { UnrepostPostHandler } from "../handlers/repost/unrepost-post.handler";
import { CreateUserHandler } from "../handlers/user/create-user.handler";
import { UpdateUserHandler } from "../handlers/user/update-user.handler";

export const getCommandHandlers = () => ({
    // Auth
    createUser: CreateUserHandler.default,
    login: LoginHandler.default,

    // Current Profile
    updateProfile: UpdateProfileHandler.default,
    getBlockedProfiles: GetBlockedProfilesHandler.default,
    getMutedProfiles: GetMutedProfilesHandler.default,

    // Current User
    updateUser: UpdateUserHandler.default,

    // Feed
    getFollowingFeed: GetFollowingFeedHandler.default,
    getTrendingFeed: GetTrendingFeedHandler.default,

    // Notifications
    getNotifications: GetNotificationsHandler.default,
    markNotificationsAsRead: MarkNotificationsAsReadHandler.default,

    // Post
    findPosts: FindPostsHandler.default,
    getPostById: GetPostByIdHandler.default,
    getPostReplies: GetPostRepliesHandler.default,
    getPostQuotes: GetPostQuotesHandler.default,
    
    createPost: CreatePostHandler.default,
    deletePost: DeletePostHandler.default,

    getPostLikes: GetPostLikesHandler.default,
    likePost: LikePostHandler.default,
    unlikePost: UnlikePostHandler.default,

    getPostReposts: GetPostRepostsHandler.default,
    repostPost: RepostPostHandler.default,
    unrepostPost: UnrepostPostHandler.default,

    // Profile
    getProfileById: GetProfileByIdHandler.default,
    getFollowers: GetFollowersHandler.default,
    getFollowing: GetFollowingHandler.default,
    blockProfile: BlockProfileHandler.default,
    unblockProfile: UnblockProfileHandler.default,
    muteProfile: MuteProfileHandler.default,
    unmuteProfile: UnmuteProfileHandler.default,
    followProfile: FollowProfileHandler.default,
    unfollowProfile: UnfollowProfileHandler.default,
    uploadAvatar: UploadAvatarHandler.default,
    deleteAvatar: DeleteAvatarHandler.default,
    uploadHeader: UploadHeaderHandler.default,
    deleteHeader: DeleteHeaderHandler.default,
})

export type Handlers = ReturnType<typeof getCommandHandlers>;
export type CommandName = keyof Handlers;
