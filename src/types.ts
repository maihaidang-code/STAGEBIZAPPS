export type ReactionType = "like" | "love" | "haha" | "wow" | "sad" | "angry";

export type PostVisibility = "public" | "followers" | "friends" | "private";

export interface ReactionSummary {
  like: number;
  love: number;
  haha: number;
  wow: number;
  sad: number;
  angry: number;
  total: number;
}

export type UserRole = "admin" | "user";

export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  avatar: string;
  coverImage: string;
  bio: string;
  location?: string;
  website?: string;
  isVerified?: boolean;
  role?: UserRole;
  followers: string[]; // array of user IDs
  following: string[]; // array of user IDs
  isFriend?: boolean;
  isFollowedBy?: boolean;
  friendsCount?: number;
  createdAt: string;
}

export interface UserSummary {
  id: string;
  username: string;
  name: string;
  avatar: string;
  bio?: string;
  isVerified?: boolean;
  role?: UserRole;
  isFollowing?: boolean;
  isFriend?: boolean;
  isFollowedBy?: boolean;
  followersCount: number;
  followingCount: number;
  friendsCount?: number;
}

export interface PostReaction {
  userId: string;
  type: ReactionType;
}

export interface PostReactionUser {
  id: string;
  username: string;
  name: string;
  avatar: string;
  bio?: string;
  isVerified?: boolean;
  role?: UserRole;
  type: ReactionType;
  isFollowing?: boolean;
  isFriend?: boolean;
  createdAt?: string;
}

export interface Post {
  id: string;
  authorId: string;
  author: {
    id: string;
    username: string;
    name: string;
    avatar: string;
    isVerified?: boolean;
    isFriend?: boolean;
  };
  content: string;
  image?: string;
  images?: string[];
  originalPostId?: string;
  originalPost?: Post | null;
  visibility?: PostVisibility;
  likes: string[]; // array of user IDs
  reactions?: PostReaction[];
  userReaction?: ReactionType | null;
  reactionsSummary?: ReactionSummary;
  commentsCount: number;
  sharesCount: number;
  createdAt: string;
  updatedAt?: string;
  isLiked?: boolean;
  isAuthor?: boolean;
}

export interface CommentReaction {
  userId: string;
  type: ReactionType;
}

export interface Comment {
  id: string;
  postId: string;
  parentId?: string | null;
  replyToUser?: {
    id: string;
    name: string;
    username: string;
  } | null;
  authorId: string;
  author: {
    id: string;
    username: string;
    name: string;
    avatar: string;
    isVerified?: boolean;
  };
  content: string;
  reactions?: CommentReaction[];
  userReaction?: ReactionType | null;
  reactionsSummary?: ReactionSummary;
  replies?: Comment[];
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ChatRoomPendingRequest {
  userId: string;
  user: {
    id: string;
    username: string;
    name: string;
    avatar: string;
    isVerified?: boolean;
    bio?: string;
  };
  message?: string;
  requestedAt: string;
}

export interface ChatRoomMember {
  id: string;
  username: string;
  name: string;
  avatar: string;
  isVerified?: boolean;
  isOwner?: boolean;
  joinedAt?: string;
}

export interface ChatRoom {
  id: string;
  name: string;
  description?: string;
  roomCode: string;
  ownerId: string;
  owner: {
    id: string;
    username: string;
    name: string;
    avatar: string;
    isVerified?: boolean;
  };
  avatar?: string;
  members: string[]; // user IDs
  membersList?: ChatRoomMember[];
  pendingRequests?: ChatRoomPendingRequest[];
  isRequireApproval: boolean;
  isOwner?: boolean;
  isMember?: boolean;
  isPending?: boolean;
  membersCount: number;
  pendingCount: number;
  lastMessage?: {
    content: string;
    senderName: string;
    createdAt: string;
  };
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  sender: {
    id: string;
    username: string;
    name: string;
    avatar: string;
    isVerified?: boolean;
    isOwner?: boolean;
  };
  content: string;
  image?: string;
  reactions?: {
    userId: string;
    type: ReactionType;
  }[];
  userReaction?: ReactionType | null;
  reactionsSummary?: ReactionSummary;
  createdAt: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export type NotificationType =
  | "like_post"
  | "post_reaction"
  | "reaction"
  | "share_post"
  | "comment_post"
  | "post_comment"
  | "reply_comment"
  | "comment_reply"
  | "comment_reaction"
  | "follow"
  | "user_follow"
  | "chat_request"
  | "chat_approved"
  | "chat_approval"
  | "chat_rejected"
  | "chat_rejection"
  | "verification_requested"
  | "verification_submitted"
  | "verification_approved"
  | "verification_rejected"
  | "verification_revoked"
  | "system";

export interface Notification {
  id: string;
  recipientId: string;
  senderId?: string;
  sender?: {
    id: string;
    username: string;
    name: string;
    avatar: string;
    isVerified?: boolean;
  };
  type: NotificationType;
  title: string;
  content: string;
  targetId?: string; // postId, roomId, userId
  targetType?: "post" | "chat" | "chat_room" | "profile" | "verification";
  isRead: boolean;
  createdAt: string;
}

export interface VerificationRequest {
  id: string;
  userId: string;
  user: {
    id: string;
    username: string;
    name: string;
    avatar: string;
    isVerified?: boolean;
    bio?: string;
    followersCount: number;
    postsCount: number;
  };
  category: string;
  reason: string;
  evidenceUrl?: string;
  status: "pending" | "approved" | "rejected";
  adminNotes?: string;
  reviewedBy?: string;
  requestedAt: string;
  reviewedAt?: string;
}
