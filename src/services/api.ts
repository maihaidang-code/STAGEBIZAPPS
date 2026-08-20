import {
  AuthResponse,
  Post,
  User,
  Comment,
  ReactionType,
  ReactionSummary,
  PostReactionUser,
  ChatRoom,
  ChatMessage,
  Notification,
  VerificationRequest,
  PostVisibility,
} from "../types";

const TOKEN_KEY = "mini_social_jwt_token";

export const getStoredToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setStoredToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const removeStoredToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

const getHeaders = (hasBody = true): HeadersInit => {
  const headers: Record<string, string> = {};
  if (hasBody) {
    headers["Content-Type"] = "application/json";
  }
  const token = getStoredToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

async function handleResponse<T>(res: globalThis.Response): Promise<T> {
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || json.message || "Đã xảy ra lỗi không xác định");
  }
  return json.data as T;
}

export const api = {
  // Authentication
  async register(data: { username: string; email: string; password: string; name: string; bio?: string; avatar?: string }): Promise<AuthResponse> {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<AuthResponse>(res);
  },

  async login(identifier: string, password: string): Promise<AuthResponse> {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ identifier, password }),
    });
    return handleResponse<AuthResponse>(res);
  },

  async getMe(): Promise<User> {
    const res = await fetch("/api/auth/me", {
      headers: getHeaders(false),
    });
    return handleResponse<User>(res);
  },

  async getDemoUsers(): Promise<(User & { defaultPassword: string })[]> {
    const res = await fetch("/api/auth/demo-users", {
      headers: getHeaders(false),
    });
    return handleResponse<(User & { defaultPassword: string })[]>(res);
  },

  // Users & Social Graph
  async getUserProfile(idOrUsername: string): Promise<User & { followersCount: number; followingCount: number; postsCount: number; isFollowing: boolean; isSelf: boolean }> {
    const res = await fetch(`/api/users/${encodeURIComponent(idOrUsername)}`, {
      headers: getHeaders(false),
    });
    return handleResponse<User & { followersCount: number; followingCount: number; postsCount: number; isFollowing: boolean; isSelf: boolean }>(res);
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    const res = await fetch("/api/users/profile", {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<User>(res);
  },

  async toggleUserVerification(userId: string): Promise<{ isVerified: boolean; user: User }> {
    const res = await fetch(`/api/users/${userId}/verify-toggle`, {
      method: "POST",
      headers: getHeaders(false),
    });
    return handleResponse<{ isVerified: boolean; user: User }>(res);
  },

  async toggleFollow(userId: string): Promise<{ isFollowing: boolean; targetFollowersCount: number; currentFollowingCount: number }> {
    const res = await fetch(`/api/users/${userId}/follow`, {
      method: "POST",
      headers: getHeaders(false),
    });
    return handleResponse<{ isFollowing: boolean; targetFollowersCount: number; currentFollowingCount: number }>(res);
  },

  async getFollowers(userId: string): Promise<(User & { isFollowing: boolean })[]> {
    const res = await fetch(`/api/users/${userId}/followers`, {
      headers: getHeaders(false),
    });
    return handleResponse<(User & { isFollowing: boolean })[]>(res);
  },

  async getFollowing(userId: string): Promise<(User & { isFollowing: boolean })[]> {
    const res = await fetch(`/api/users/${userId}/following`, {
      headers: getHeaders(false),
    });
    return handleResponse<(User & { isFollowing: boolean })[]>(res);
  },

  async getSuggestedUsers(): Promise<(User & { followersCount: number; isFollowing: boolean })[]> {
    const res = await fetch("/api/users/suggested", {
      headers: getHeaders(false),
    });
    return handleResponse<(User & { followersCount: number; isFollowing: boolean })[]>(res);
  },

  async searchUsers(query: string): Promise<User[]> {
    const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`, {
      headers: getHeaders(false),
    });
    return handleResponse<User[]>(res);
  },

  // Posts
  async getPosts(params?: { tab?: "for-you" | "following" | "friends" | "explore"; userId?: string; search?: string }): Promise<Post[]> {
    const query = new URLSearchParams();
    if (params?.tab) query.append("tab", params.tab);
    if (params?.userId) query.append("userId", params.userId);
    if (params?.search) query.append("search", params.search);

    const res = await fetch(`/api/posts?${query.toString()}`, {
      headers: getHeaders(false),
    });
    return handleResponse<Post[]>(res);
  },

  async getPostById(id: string): Promise<Post> {
    const res = await fetch(`/api/posts/${id}`, {
      headers: getHeaders(false),
    });
    return handleResponse<Post>(res);
  },

  async createPost(content: string, imageOrImages?: string | string[], visibility?: PostVisibility): Promise<Post> {
    const images = Array.isArray(imageOrImages) ? imageOrImages : imageOrImages ? [imageOrImages] : [];
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ 
        content, 
        image: images[0] || undefined, 
        images: images.length > 0 ? images : undefined,
        visibility 
      }),
    });
    return handleResponse<Post>(res);
  },

  async updatePost(id: string, content: string, imageOrImages?: string | string[], visibility?: PostVisibility): Promise<Post> {
    const images = Array.isArray(imageOrImages) ? imageOrImages : imageOrImages ? [imageOrImages] : [];
    const res = await fetch(`/api/posts/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify({ 
        content, 
        image: images[0] || undefined, 
        images: images,
        visibility 
      }),
    });
    return handleResponse<Post>(res);
  },

  async deletePost(id: string): Promise<void> {
    const res = await fetch(`/api/posts/${id}`, {
      method: "DELETE",
      headers: getHeaders(false),
    });
    await handleResponse<{ success: boolean }>(res);
  },

  async toggleLike(postId: string): Promise<{ isLiked: boolean; likesCount: number; userReaction?: ReactionType | null; reactionsSummary?: ReactionSummary }> {
    const res = await fetch(`/api/posts/${postId}/like`, {
      method: "POST",
      headers: getHeaders(false),
    });
    return handleResponse<{ isLiked: boolean; likesCount: number; userReaction?: ReactionType | null; reactionsSummary?: ReactionSummary }>(res);
  },

  async reactToPost(postId: string, type: ReactionType): Promise<{ isLiked: boolean; likesCount: number; userReaction: ReactionType | null; reactionsSummary: ReactionSummary }> {
    const res = await fetch(`/api/posts/${postId}/react`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ type }),
    });
    return handleResponse<{ isLiked: boolean; likesCount: number; userReaction: ReactionType | null; reactionsSummary: ReactionSummary }>(res);
  },

  async sharePost(postId: string): Promise<{ sharesCount: number }> {
    const res = await fetch(`/api/posts/${postId}/share`, {
      method: "POST",
      headers: getHeaders(false),
    });
    return handleResponse<{ sharesCount: number }>(res);
  },

  async sharePostToProfile(postId: string, content?: string, visibility?: PostVisibility): Promise<{ newPost: Post; sharesCount: number }> {
    const res = await fetch(`/api/posts/${postId}/share`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ shareToProfile: true, content, visibility }),
    });
    return handleResponse<{ newPost: Post; sharesCount: number }>(res);
  },

  async getPostReactions(postId: string): Promise<{ users: PostReactionUser[]; reactionsSummary: ReactionSummary; total: number }> {
    const res = await fetch(`/api/posts/${postId}/reactions`, {
      headers: getHeaders(false),
    });
    return handleResponse<{ users: PostReactionUser[]; reactionsSummary: ReactionSummary; total: number }>(res);
  },

  // Comments
  async getComments(postId: string): Promise<Comment[]> {
    const res = await fetch(`/api/posts/${postId}/comments`, {
      headers: getHeaders(false),
    });
    return handleResponse<Comment[]>(res);
  },

  async addComment(postId: string, content: string, parentId?: string, replyToUserId?: string): Promise<Comment> {
    const res = await fetch(`/api/posts/${postId}/comments`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ content, parentId, replyToUserId }),
    });
    return handleResponse<Comment>(res);
  },

  async reactToComment(postId: string, commentId: string, type: ReactionType): Promise<{ userReaction: ReactionType | null; reactionsSummary: ReactionSummary; totalReactions: number }> {
    const res = await fetch(`/api/posts/${postId}/comments/${commentId}/react`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ type }),
    });
    return handleResponse<{ userReaction: ReactionType | null; reactionsSummary: ReactionSummary; totalReactions: number }>(res);
  },

  async deleteComment(postId: string, commentId: string): Promise<void> {
    const res = await fetch(`/api/posts/${postId}/comments/${commentId}`, {
      method: "DELETE",
      headers: getHeaders(false),
    });
    await handleResponse<{ success: boolean }>(res);
  },

  // ==========================================
  // CHAT ROOMS & APPROVAL SYSTEM
  // ==========================================
  async getChatRooms(): Promise<ChatRoom[]> {
    const res = await fetch("/api/chat/rooms", {
      headers: getHeaders(false),
    });
    return handleResponse<ChatRoom[]>(res);
  },

  async getChatRoom(id: string): Promise<ChatRoom> {
    const res = await fetch(`/api/chat/rooms/${id}`, {
      headers: getHeaders(false),
    });
    return handleResponse<ChatRoom>(res);
  },

  async createChatRoom(data: {
    name: string;
    description?: string;
    roomCode?: string;
    isRequireApproval?: boolean;
    avatar?: string;
  }): Promise<{ message: string; data: ChatRoom }> {
    const res = await fetch("/api/chat/rooms", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<{ message: string; data: ChatRoom }>(res);
  },

  async joinRoomByCode(code: string, message?: string): Promise<{ status: string; message: string; data: ChatRoom }> {
    const res = await fetch("/api/chat/rooms/join-by-code", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ code, message }),
    });
    return handleResponse<{ status: string; message: string; data: ChatRoom }>(res);
  },

  async approveJoinRequest(roomId: string, userId: string): Promise<{ message: string; data: ChatRoom }> {
    const res = await fetch(`/api/chat/rooms/${roomId}/requests/${userId}/approve`, {
      method: "POST",
      headers: getHeaders(),
    });
    return handleResponse<{ message: string; data: ChatRoom }>(res);
  },

  async rejectJoinRequest(roomId: string, userId: string): Promise<{ message: string; data: ChatRoom }> {
    const res = await fetch(`/api/chat/rooms/${roomId}/requests/${userId}/reject`, {
      method: "POST",
      headers: getHeaders(),
    });
    return handleResponse<{ message: string; data: ChatRoom }>(res);
  },

  async removeRoomMember(roomId: string, userId: string): Promise<{ message: string; data: ChatRoom }> {
    const res = await fetch(`/api/chat/rooms/${roomId}/members/${userId}/remove`, {
      method: "POST",
      headers: getHeaders(),
    });
    return handleResponse<{ message: string; data: ChatRoom }>(res);
  },

  async deleteChatRoom(roomId: string): Promise<{ message: string }> {
    const res = await fetch(`/api/chat/rooms/${roomId}`, {
      method: "DELETE",
      headers: getHeaders(false),
    });
    return handleResponse<{ message: string }>(res);
  },

  async getChatMessages(roomId: string): Promise<ChatMessage[]> {
    const res = await fetch(`/api/chat/rooms/${roomId}/messages`, {
      headers: getHeaders(false),
    });
    return handleResponse<ChatMessage[]>(res);
  },

  async sendChatMessage(roomId: string, content: string, image?: string): Promise<ChatMessage> {
    const res = await fetch(`/api/chat/rooms/${roomId}/messages`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ content, image }),
    });
    return handleResponse<ChatMessage>(res);
  },

  async reactToChatMessage(
    roomId: string,
    messageId: string,
    type: ReactionType
  ): Promise<{ userReaction: ReactionType | null; reactionsSummary: ReactionSummary; reactions: { userId: string; type: ReactionType }[] }> {
    const res = await fetch(`/api/chat/rooms/${roomId}/messages/${messageId}/react`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ type }),
    });
    return handleResponse<{ userReaction: ReactionType | null; reactionsSummary: ReactionSummary; reactions: { userId: string; type: ReactionType }[] }>(res);
  },

  // ==========================================
  // ACCOUNT SETTINGS (PASSWORD & DELETION)
  // ==========================================
  async changePassword(data: { currentPassword: string; newPassword: string; confirmPassword?: string }): Promise<{ message: string }> {
    const res = await fetch("/api/users/change-password", {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Đổi mật khẩu thất bại");
    }
    return json;
  },

  async deleteAccount(password: string): Promise<{ message: string }> {
    const res = await fetch("/api/users/account", {
      method: "DELETE",
      headers: getHeaders(),
      body: JSON.stringify({ password }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Xóa tài khoản thất bại");
    }
    return json;
  },

  // ==========================================
  // VERIFICATION (TICK XANH) REQUESTS & ADMIN
  // ==========================================
  async submitVerificationRequest(data: { category: string; reason: string; evidenceUrl?: string }): Promise<VerificationRequest> {
    const res = await fetch("/api/verification/request", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<VerificationRequest>(res);
  },

  async getMyVerificationRequest(): Promise<VerificationRequest | null> {
    const res = await fetch("/api/verification/my-request", {
      headers: getHeaders(false),
    });
    return handleResponse<VerificationRequest | null>(res);
  },

  async cancelVerificationRequest(): Promise<{ message: string }> {
    const res = await fetch("/api/verification/my-request", {
      method: "DELETE",
      headers: getHeaders(false),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Không thể hủy yêu cầu");
    }
    return json;
  },

  async getAdminVerificationRequests(status?: string): Promise<VerificationRequest[]> {
    const query = status ? `?status=${encodeURIComponent(status)}` : "";
    const res = await fetch(`/api/admin/verification-requests${query}`, {
      headers: getHeaders(false),
    });
    return handleResponse<VerificationRequest[]>(res);
  },

  async approveVerificationRequest(requestId: string, adminNotes?: string): Promise<{ request: VerificationRequest; user: User }> {
    const res = await fetch(`/api/admin/verification-requests/${requestId}/approve`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ adminNotes }),
    });
    return handleResponse<{ request: VerificationRequest; user: User }>(res);
  },

  async rejectVerificationRequest(requestId: string, adminNotes?: string): Promise<VerificationRequest> {
    const res = await fetch(`/api/admin/verification-requests/${requestId}/reject`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ adminNotes }),
    });
    return handleResponse<VerificationRequest>(res);
  },

  async revokeUserVerification(userId: string, reason?: string): Promise<User> {
    const res = await fetch(`/api/admin/users/${userId}/revoke-verification`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ reason }),
    });
    return handleResponse<User>(res);
  },

  async grantUserVerification(userId: string): Promise<User> {
    const res = await fetch(`/api/admin/users/${userId}/grant-verification`, {
      method: "POST",
      headers: getHeaders(false),
    });
    return handleResponse<User>(res);
  },

  // ==========================================
  // NOTIFICATIONS
  // ==========================================
  async getNotifications(params?: { unreadOnly?: boolean; type?: string }): Promise<{ notifications: Notification[]; unreadCount: number; total: number }> {
    const query = new URLSearchParams();
    if (params?.unreadOnly) query.append("unreadOnly", "true");
    if (params?.type && params.type !== "all") query.append("type", params.type);

    const res = await fetch(`/api/notifications?${query.toString()}`, {
      headers: getHeaders(false),
    });
    return handleResponse<{ notifications: Notification[]; unreadCount: number; total: number }>(res);
  },

  async markNotificationAsRead(id: string): Promise<{ notification: Notification; unreadCount: number }> {
    const res = await fetch(`/api/notifications/${id}/read`, {
      method: "PUT",
      headers: getHeaders(false),
    });
    return handleResponse<{ notification: Notification; unreadCount: number }>(res);
  },

  async markAllNotificationsAsRead(): Promise<{ unreadCount: number }> {
    const res = await fetch("/api/notifications/read-all", {
      method: "PUT",
      headers: getHeaders(false),
    });
    return handleResponse<{ unreadCount: number }>(res);
  },

  async deleteNotification(id: string): Promise<{ unreadCount: number }> {
    const res = await fetch(`/api/notifications/${id}`, {
      method: "DELETE",
      headers: getHeaders(false),
    });
    return handleResponse<{ unreadCount: number }>(res);
  },

  async clearAllNotifications(): Promise<{ unreadCount: number }> {
    const res = await fetch("/api/notifications", {
      method: "DELETE",
      headers: getHeaders(false),
    });
    return handleResponse<{ unreadCount: number }>(res);
  },
};
