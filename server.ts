import express, { Request, Response, NextFunction } from "express";
import path from "path";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { createServer as createViteServer } from "vite";

const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "mini_social_network_super_secret_key_2026";

type ReactionType = "like" | "love" | "haha" | "wow" | "sad" | "angry";

interface StoredReaction {
  userId: string;
  type: ReactionType;
  createdAt?: string;
}

interface StoredUser {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  name: string;
  avatar: string;
  coverImage: string;
  bio: string;
  location?: string;
  website?: string;
  isVerified?: boolean;
  role?: "admin" | "user";
  followers: string[];
  following: string[];
  createdAt: string;
  deletionRequestedAt?: string;
  markedForDeletion?: boolean;
}

interface StoredNotification {
  id: string;
  recipientId: string;
  senderId?: string;
  type: string;
  title: string;
  content: string;
  targetId?: string;
  targetType?: "post" | "chat" | "chat_room" | "profile" | "verification";
  isRead: boolean;
  createdAt: string;
}

interface StoredVerificationRequest {
  id: string;
  userId: string;
  category: string;
  reason: string;
  evidenceUrl?: string;
  status: "pending" | "approved" | "rejected";
  adminNotes?: string;
  reviewedBy?: string;
  requestedAt: string;
  reviewedAt?: string;
}

type PostVisibility = "public" | "followers" | "friends" | "private";

interface StoredPost {
  id: string;
  authorId: string;
  content: string;
  image?: string;
  images?: string[];
  originalPostId?: string;
  visibility?: PostVisibility;
  likes: string[];
  reactions?: StoredReaction[];
  sharesCount: number;
  createdAt: string;
  updatedAt?: string;
}

interface StoredComment {
  id: string;
  postId: string;
  parentId?: string | null;
  replyToUser?: {
    id: string;
    name: string;
    username: string;
  } | null;
  authorId: string;
  content: string;
  reactions?: StoredReaction[];
  createdAt: string;
}

interface StoredChatPendingRequest {
  userId: string;
  message?: string;
  requestedAt: string;
}

interface StoredChatRoom {
  id: string;
  name: string;
  description?: string;
  roomCode: string;
  ownerId: string;
  avatar?: string;
  members: string[]; // array of user IDs who are approved
  pendingRequests: StoredChatPendingRequest[]; // users waiting for room owner (trưởng phòng) approval
  isRequireApproval: boolean;
  createdAt: string;
}

interface StoredChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  content: string;
  image?: string;
  reactions?: StoredReaction[];
  createdAt: string;
}

// Initial Database Seeding with realistic Vietnamese community users & posts
const defaultPasswordHash = bcrypt.hashSync("123456", 10);

const initialUsers: StoredUser[] = [
  {
    id: "user-1",
    username: "haidang_dev",
    email: "maihaidang.lienhe@gmail.com",
    passwordHash: defaultPasswordHash,
    name: "Mai Hải Đăng",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80",
    coverImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80",
    bio: "Fullstack Developer đam mê React, Node.js và hệ thống phân tán. Quản trị viên (Admin) StageBiz!",
    location: "Hà Nội, Việt Nam",
    website: "https://github.com",
    isVerified: true,
    role: "admin",
    followers: ["user-2", "user-3", "user-4"],
    following: ["user-2", "user-3"],
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: "user-2",
    username: "linh_tran_art",
    email: "linh.tran@example.com",
    passwordHash: defaultPasswordHash,
    name: "Trần Mỹ Linh",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80",
    coverImage: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&auto=format&fit=crop&q=80",
    bio: "UI/UX Designer & Nhiếp ảnh gia tự do. Thích ngắm hoàng hôn, uống matcha latte và chia sẻ cảm hứng sáng tạo trên StageBiz.",
    location: "TP. Hồ Chí Minh, Việt Nam",
    website: "https://dribbble.com",
    isVerified: true,
    role: "user",
    followers: ["user-1", "user-3", "user-5"],
    following: ["user-1", "user-4"],
    createdAt: new Date(Date.now() - 25 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: "user-3",
    username: "hoangnam_tech",
    email: "nam.hoang@example.com",
    passwordHash: defaultPasswordHash,
    name: "Hoàng Nam",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=400&auto=format&fit=crop&q=80",
    coverImage: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80",
    bio: "AI Engineer & Cloud Architect. Luôn tìm tòi những công nghệ mới nhất về LLM và Web3.",
    location: "Đà Nẵng, Việt Nam",
    website: "https://linkedin.com",
    isVerified: true,
    role: "user",
    followers: ["user-1", "user-2"],
    following: ["user-1", "user-2", "user-5"],
    createdAt: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: "user-4",
    username: "lan_huong_travel",
    email: "huong.lan@example.com",
    passwordHash: defaultPasswordHash,
    name: "Lê Lan Hương",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
    coverImage: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80",
    bio: "Travel Blogger khám phá 28 quốc gia. Yêu thiên nhiên, ẩm thực đường phố và những chuyến đi bất tận ✈️",
    location: "Đà Lạt, Việt Nam",
    website: "https://instagram.com",
    isVerified: false,
    role: "user",
    followers: ["user-1", "user-2"],
    following: ["user-1"],
    createdAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: "user-5",
    username: "quoc_bao_photo",
    email: "bao.quoc@example.com",
    passwordHash: defaultPasswordHash,
    name: "Vũ Quốc Bảo",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
    coverImage: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&auto=format&fit=crop&q=80",
    bio: "Visual Storyteller & Coffee Enthusiast. Chia sẻ góc nhìn cuộc sống qua lăng kính máy ảnh 📸",
    location: "Hà Nội, Việt Nam",
    website: "https://unsplash.com",
    isVerified: false,
    role: "user",
    followers: ["user-3"],
    following: ["user-2"],
    createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
  },
];

const initialPosts: StoredPost[] = [
  {
    id: "post-1",
    authorId: "user-1",
    content: "Chào mọi người! 👋 Hôm nay mình vừa hoàn thiện xong bản dựng kiến trúc mạng xã hội StageBiz với Express API, xác thực JWT, bày tỏ cảm xúc phong phú và trả lời bình luận nhiều cấp. Mọi người cùng trải nghiệm và góp ý nhé! 🚀 #ReactJS #NodeJS #StageBiz",
    image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1000&auto=format&fit=crop&q=80",
    likes: ["user-2", "user-3", "user-4", "user-5"],
    reactions: [
      { userId: "user-2", type: "love" },
      { userId: "user-3", type: "like" },
      { userId: "user-4", type: "wow" },
      { userId: "user-5", type: "haha" },
    ],
    sharesCount: 5,
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 mins ago
  },
  {
    id: "post-2",
    authorId: "user-2",
    content: "Một buổi sáng chủ nhật an yên với ly cafe latte và bản phác thảo giao diện mới ☕️🎨 Không gian làm việc tối giản luôn giúp mình nạp lại 100% năng lượng sáng tạo.",
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1000&auto=format&fit=crop&q=80",
    likes: ["user-1", "user-3", "user-5"],
    reactions: [
      { userId: "user-1", type: "love" },
      { userId: "user-3", type: "like" },
      { userId: "user-5", type: "love" },
    ],
    sharesCount: 2,
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(), // 2 hours ago
  },
  {
    id: "post-3",
    authorId: "user-4",
    content: "Hoàng hôn buông xuống trên bãi biển Nha Trang chiều nay thật sự đẹp ngoạn mục! Biển êm, gió nhẹ và màu trời chuyển từ cam sang tím huyền ảo 🌅",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000&auto=format&fit=crop&q=80",
    likes: ["user-1", "user-2"],
    reactions: [
      { userId: "user-1", type: "wow" },
      { userId: "user-2", type: "love" },
    ],
    sharesCount: 7,
    createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(), // 5 hours ago
  },
  {
    id: "post-4",
    authorId: "user-3",
    content: "Vừa đọc xong bài báo nghiên cứu về việc tối ưu hóa latency cho các ứng dụng thời gian thực. Việc thiết kế clean architecture ngay từ đầu giúp việc scale backend sau này dễ dàng hơn gấp nhiều lần 💡",
    likes: ["user-1", "user-5"],
    reactions: [
      { userId: "user-1", type: "like" },
      { userId: "user-5", type: "like" },
    ],
    sharesCount: 1,
    createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(), // 12 hours ago
  },
  {
    id: "post-5",
    authorId: "user-5",
    content: "Góc phố cổ Hà Nội sau cơn mưa rào. Những vệt nước phản chiếu ánh đèn vàng tạo nên vẻ đẹp trầm mặc rất riêng 🌧️✨",
    image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1000&auto=format&fit=crop&q=80",
    likes: ["user-2", "user-3"],
    reactions: [
      { userId: "user-2", type: "love" },
      { userId: "user-3", type: "like" },
    ],
    sharesCount: 3,
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(), // 1 day ago
  },
];

const initialComments: StoredComment[] = [
  {
    id: "comment-1",
    postId: "post-1",
    authorId: "user-2",
    content: "Dự án tuyệt vời quá Đăng ơi! Giao diện mượt mà và API chạy rất nhanh 🔥",
    reactions: [
      { userId: "user-1", type: "love" },
      { userId: "user-3", type: "like" },
    ],
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  },
  {
    id: "comment-1-reply-1",
    postId: "post-1",
    parentId: "comment-1",
    replyToUser: {
      id: "user-2",
      name: "Trần Mỹ Linh",
      username: "mylinh_design",
    },
    authorId: "user-1",
    content: "Cảm ơn Linh nhé! Tính năng thả cảm xúc và trả lời bình luận hoạt động cực mượt luôn ❤️",
    reactions: [
      { userId: "user-2", type: "love" },
    ],
    createdAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
  },
  {
    id: "comment-2",
    postId: "post-1",
    authorId: "user-3",
    content: "Kiến trúc JWT + Express chuẩn chỉ đấy. Rất đáng để tham khảo!",
    reactions: [
      { userId: "user-1", type: "like" },
    ],
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: "comment-3",
    postId: "post-2",
    authorId: "user-1",
    content: "Bức ảnh đẹp và góc chụp rất có gu Linh ạ!",
    reactions: [
      { userId: "user-2", type: "love" },
    ],
    createdAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
  },
  {
    id: "comment-4",
    postId: "post-3",
    authorId: "user-2",
    content: "Thèm đi biển quá Hương ơi 😍",
    reactions: [
      { userId: "user-4", type: "love" },
    ],
    createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
  },
];

const initialChatRooms: StoredChatRoom[] = [
  {
    id: "room-1",
    name: "🚀 CLB Lập trình & Tech StageBiz",
    description: "Nhóm trao đổi công nghệ, chia sẻ code TypeScript, React & Node.js.",
    roomCode: "STAGEBIZ",
    ownerId: "user-1", // Mai Hải Đăng is Trưởng phòng
    avatar: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&auto=format&fit=crop&q=80",
    members: ["user-1", "user-2", "user-3"],
    pendingRequests: [
      {
        userId: "user-4", // Lê Lan Hương requested to join
        message: "Chào anh Đăng, em xin vào giao lưu học hỏi công nghệ với ạ!",
        requestedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      },
      {
        userId: "user-5", // Vũ Quốc Bảo requested to join
        message: "Cho mình xin tham gia thảo luận cùng team nhé!",
        requestedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      },
    ],
    isRequireApproval: true,
    createdAt: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: "room-2",
    name: "🎨 Hội Quán Designer & Sáng Tạo",
    description: "Không gian kết nối các bạn đam mê thiết kế UI/UX, đồ họa và nhiếp ảnh.",
    roomCode: "DESIGN99",
    ownerId: "user-2", // Trần Mỹ Linh is Trưởng phòng
    avatar: "https://images.unsplash.com/photo-1542744094-3a31f272c490?w=400&auto=format&fit=crop&q=80",
    members: ["user-2", "user-1", "user-5"],
    pendingRequests: [
      {
        userId: "user-3",
        message: "Em muốn tham khảo thêm về hệ thống Design Tokens ạ!",
        requestedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      },
    ],
    isRequireApproval: true,
    createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
  },
];

const initialChatMessages: StoredChatMessage[] = [
  {
    id: "msg-1",
    roomId: "room-1",
    senderId: "user-1",
    content: "Chào mừng các bạn đến với Box Chat Công nghệ StageBiz! 🎉 Mọi người nhập mã 'STAGEBIZ' và được duyệt là có thể trò chuyện tại đây.",
    reactions: [
      { userId: "user-2", type: "love" },
      { userId: "user-3", type: "like" },
    ],
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
  {
    id: "msg-2",
    roomId: "room-1",
    senderId: "user-2",
    content: "Chào Trưởng phòng Đăng và cả nhà 👋 Tính năng tạo phòng chat theo mã code và phê duyệt thành viên này hoạt động mượt mà lắm!",
    reactions: [
      { userId: "user-1", type: "love" },
    ],
    createdAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
  },
  {
    id: "msg-3",
    roomId: "room-1",
    senderId: "user-3",
    content: "Cơ chế bảo mật duyệt thành viên giúp kiểm soát box chat rất tốt, không sợ bị spam link bậy bạ 👍",
    reactions: [
      { userId: "user-1", type: "like" },
      { userId: "user-2", type: "like" },
    ],
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: "msg-4",
    roomId: "room-2",
    senderId: "user-2",
    content: "Chào mừng team sáng tạo! Nhập mã 'DESIGN99' để tham gia phòng thiết kế nhé 🎨✨",
    createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
  },
  {
    id: "msg-5",
    roomId: "room-2",
    senderId: "user-5",
    content: "Mình vừa chụp bộ ảnh Hà Nội hoàng hôn, lát gửi mọi người góp ý tone màu nhé 📸",
    reactions: [
      { userId: "user-2", type: "love" },
    ],
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
];

const initialNotifications: StoredNotification[] = [
  {
    id: "notif-1",
    recipientId: "user-1",
    senderId: "user-4",
    type: "verification_requested",
    title: "Yêu cầu cấp tick xanh mới",
    content: "Lê Lan Hương (@lan_huong_travel) vừa gửi yêu cầu xác minh tài khoản tick xanh danh mục 'Travel Blogger / Sáng tạo nội dung'.",
    targetId: "vreq-1",
    targetType: "verification",
    isRead: false,
    createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
  },
  {
    id: "notif-2",
    recipientId: "user-1",
    senderId: "user-2",
    type: "like_post",
    title: "Bày tỏ cảm xúc bài viết",
    content: "Trần Mỹ Linh đã thả cảm xúc ❤️ vào bài viết kiến trúc StageBiz của bạn.",
    targetId: "post-1",
    targetType: "post",
    isRead: false,
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
  {
    id: "notif-3",
    recipientId: "user-1",
    senderId: "user-3",
    type: "reply_comment",
    title: "Phản hồi bình luận",
    content: "Hoàng Nam đã trả lời bình luận của bạn trong bài viết về React & Node.js.",
    targetId: "post-1",
    targetType: "post",
    isRead: true,
    createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
  },
  {
    id: "notif-4",
    recipientId: "user-1",
    senderId: "user-5",
    type: "chat_request",
    title: "Yêu cầu tham gia Box Chat",
    content: "Vũ Quốc Bảo đã gửi yêu cầu tham gia phòng chat 'Dev & Tech Leaders Vietnam'.",
    targetId: "room-1",
    targetType: "chat",
    isRead: false,
    createdAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
  },
  {
    id: "notif-5",
    recipientId: "user-4",
    senderId: "user-1",
    type: "follow",
    title: "Người theo dõi mới",
    content: "Mai Hải Đăng (@haidang_dev) đã bắt đầu theo dõi bạn.",
    targetId: "user-1",
    targetType: "profile",
    isRead: false,
    createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
  },
];

const initialVerificationRequests: StoredVerificationRequest[] = [
  {
    id: "vreq-1",
    userId: "user-4",
    category: "Travel Blogger / Sáng tạo nội dung",
    reason: "Mình là blogger du lịch với hơn 28 chuyến hành trình quốc tế, mong muốn được xác thực chính chủ trên StageBiz để chia sẻ hành trình đáng tin cậy.",
    evidenceUrl: "https://instagram.com/lan_huong_travel",
    status: "pending",
    requestedAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
  },
];

// In-memory Database Store
class Database {
  users: StoredUser[] = [...initialUsers];
  posts: StoredPost[] = [...initialPosts];
  comments: StoredComment[] = [...initialComments];
  chatRooms: StoredChatRoom[] = [...initialChatRooms];
  chatMessages: StoredChatMessage[] = [...initialChatMessages];
  notifications: StoredNotification[] = [...initialNotifications];
  verificationRequests: StoredVerificationRequest[] = [...initialVerificationRequests];

  // Helper to format user for client (exclude passwordHash)
  sanitizeUser(user: StoredUser) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  findUserById(id: string) {
    return this.users.find((u) => u.id === id);
  }

  findUserByEmail(email: string) {
    return this.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  findUserByUsername(username: string) {
    return this.users.find((u) => u.username.toLowerCase() === username.toLowerCase());
  }

  isFriends(userAId: string, userBId: string): boolean {
    if (!userAId || !userBId || userAId === userBId) return false;
    const uA = this.findUserById(userAId);
    const uB = this.findUserById(userBId);
    if (!uA || !uB) return false;
    return (uA.following || []).includes(userBId) && (uB.following || []).includes(userAId);
  }

  getFriendsCount(userId: string): number {
    const u = this.findUserById(userId);
    if (!u) return 0;
    return (u.following || []).filter((id) => {
      const other = this.findUserById(id);
      return other && (other.following || []).includes(userId);
    }).length;
  }

  canViewPost(post: StoredPost, currentUserId?: string, userRole?: string): boolean {
    const visibility = post.visibility || "public";
    if (visibility === "public") return true;

    if (!currentUserId) return false;
    if (post.authorId === currentUserId) return true;
    if (userRole === "admin") return true;

    if (visibility === "private") return false;

    if (visibility === "followers") {
      const author = this.findUserById(post.authorId);
      return Boolean(author && (author.followers || []).includes(currentUserId));
    }

    if (visibility === "friends") {
      return this.isFriends(post.authorId, currentUserId);
    }

    return false;
  }

  createNotification(params: {
    recipientId: string;
    senderId?: string;
    type: string;
    title: string;
    content: string;
    targetId?: string;
    targetType?: "post" | "chat" | "chat_room" | "profile" | "verification";
  }) {
    // Don't send notification to self
    if (params.senderId && params.recipientId === params.senderId) {
      return null;
    }

    const newNotif: StoredNotification = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      recipientId: params.recipientId,
      senderId: params.senderId,
      type: params.type,
      title: params.title,
      content: params.content,
      targetId: params.targetId,
      targetType: params.targetType,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    this.notifications.unshift(newNotif);
    return newNotif;
  }

  getNotificationWithDetails(notif: StoredNotification) {
    const sender = notif.senderId ? this.findUserById(notif.senderId) : null;
    return {
      id: notif.id,
      recipientId: notif.recipientId,
      senderId: notif.senderId,
      sender: sender
        ? {
            id: sender.id,
            username: sender.username,
            name: sender.name,
            avatar: sender.avatar,
            isVerified: sender.isVerified ?? false,
          }
        : undefined,
      type: notif.type,
      title: notif.title,
      content: notif.content,
      targetId: notif.targetId,
      targetType: notif.targetType,
      isRead: notif.isRead,
      createdAt: notif.createdAt,
    };
  }

  getVerificationRequestWithDetails(req: StoredVerificationRequest) {
    const user = this.findUserById(req.userId);
    const userPosts = this.posts.filter((p) => p.authorId === req.userId);

    return {
      id: req.id,
      userId: req.userId,
      user: {
        id: user?.id || req.userId,
        username: user?.username || "user",
        name: user?.name || "Người dùng",
        avatar: user?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80",
        isVerified: user?.isVerified ?? false,
        bio: user?.bio,
        followersCount: user?.followers.length || 0,
        postsCount: userPosts.length,
      },
      category: req.category,
      reason: req.reason,
      evidenceUrl: req.evidenceUrl,
      status: req.status,
      adminNotes: req.adminNotes,
      reviewedBy: req.reviewedBy,
      requestedAt: req.requestedAt,
      reviewedAt: req.reviewedAt,
    };
  }

  getReactionSummary(reactions: StoredReaction[] = []) {
    const summary = {
      like: 0,
      love: 0,
      haha: 0,
      wow: 0,
      sad: 0,
      angry: 0,
      total: reactions.length,
    };
    reactions.forEach((r) => {
      if (summary[r.type] !== undefined) {
        summary[r.type]++;
      }
    });
    return summary;
  }

  getPostWithDetails(post: StoredPost, currentUserId?: string) {
    const author = this.findUserById(post.authorId);
    const postComments = this.comments.filter((c) => c.postId === post.id);
    
    // Ensure reactions array is present
    if (!post.reactions) {
      post.reactions = (post.likes || []).map((id) => ({ userId: id, type: "like" as ReactionType }));
    }
    
    const reactions = post.reactions;
    const reactionsSummary = this.getReactionSummary(reactions);
    const userReaction = currentUserId ? reactions.find((r) => r.userId === currentUserId)?.type || null : null;

    let originalPost = null;
    if (post.originalPostId) {
      const orig = this.posts.find((p) => p.id === post.originalPostId);
      if (orig) {
        const origAuthor = this.findUserById(orig.authorId);
        originalPost = {
          id: orig.id,
          authorId: orig.authorId,
          author: {
            id: origAuthor?.id || orig.authorId,
            username: origAuthor?.username || "anonym",
            name: origAuthor?.name || "Người dùng",
            avatar: origAuthor?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80",
            isVerified: origAuthor?.isVerified ?? false,
          },
          content: orig.content,
          image: orig.image,
          createdAt: orig.createdAt,
          sharesCount: orig.sharesCount || 0,
        };
      }
    }

    // Normalize images array
    const images: string[] = post.images && post.images.length > 0 
      ? post.images 
      : post.image 
        ? [post.image] 
        : [];

    return {
      id: post.id,
      authorId: post.authorId,
      author: {
        id: author?.id || post.authorId,
        username: author?.username || "anonym",
        name: author?.name || "Người dùng",
        avatar: author?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80",
        isVerified: author?.isVerified ?? false,
        isFriend: currentUserId ? this.isFriends(post.authorId, currentUserId) : false,
      },
      content: post.content,
      image: post.image || images[0],
      images,
      originalPostId: post.originalPostId,
      originalPost,
      visibility: post.visibility || "public",
      likes: reactions.map((r) => r.userId),
      reactions,
      userReaction,
      reactionsSummary,
      commentsCount: postComments.length,
      sharesCount: post.sharesCount || 0,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      isLiked: Boolean(userReaction || (currentUserId && post.likes?.includes(currentUserId))),
      isAuthor: currentUserId === post.authorId,
    };
  }

  getCommentWithDetails(comment: StoredComment, currentUserId?: string) {
    const author = this.findUserById(comment.authorId);
    const reactions = comment.reactions || [];
    const reactionsSummary = this.getReactionSummary(reactions);
    const userReaction = currentUserId ? reactions.find((r) => r.userId === currentUserId)?.type || null : null;

    return {
      id: comment.id,
      postId: comment.postId,
      parentId: comment.parentId || null,
      replyToUser: comment.replyToUser || null,
      authorId: comment.authorId,
      author: {
        id: author?.id || comment.authorId,
        username: author?.username || "anonym",
        name: author?.name || "Người dùng",
        avatar: author?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80",
        isVerified: author?.isVerified ?? false,
      },
      content: comment.content,
      reactions,
      userReaction,
      reactionsSummary,
      createdAt: comment.createdAt,
    };
  }

  getChatRoomWithDetails(room: StoredChatRoom, currentUserId?: string) {
    const owner = this.findUserById(room.ownerId);
    const isOwner = currentUserId === room.ownerId;
    const isMember = currentUserId ? room.members.includes(currentUserId) : false;
    const pendingReq = currentUserId ? room.pendingRequests.find((p) => p.userId === currentUserId) : null;
    const isPending = Boolean(pendingReq);

    // Get detailed members list
    const membersList = room.members
      .map((memberId) => {
        const u = this.findUserById(memberId);
        if (!u) return null;
        return {
          id: u.id,
          username: u.username,
          name: u.name,
          avatar: u.avatar,
          isVerified: u.isVerified ?? false,
          isOwner: u.id === room.ownerId,
        };
      })
      .filter((m): m is NonNullable<typeof m> => Boolean(m));

    // Get detailed pending requests (only owner or the requesting user can see details)
    const pendingRequestsFormatted = room.pendingRequests
      .map((req) => {
        const u = this.findUserById(req.userId);
        if (!u) return null;
        return {
          userId: req.userId,
          user: {
            id: u.id,
            username: u.username,
            name: u.name,
            avatar: u.avatar,
            isVerified: u.isVerified ?? false,
            bio: u.bio,
          },
          message: req.message,
          requestedAt: req.requestedAt,
        };
      })
      .filter((p): p is NonNullable<typeof p> => Boolean(p));

    // Get last message in room
    const roomMessages = this.chatMessages.filter((m) => m.roomId === room.id);
    const lastMsg = roomMessages.length > 0 ? roomMessages[roomMessages.length - 1] : null;
    let lastMessageInfo = undefined;
    if (lastMsg) {
      const sender = this.findUserById(lastMsg.senderId);
      lastMessageInfo = {
        content: lastMsg.content,
        senderName: sender?.name || "Người dùng",
        createdAt: lastMsg.createdAt,
      };
    }

    return {
      id: room.id,
      name: room.name,
      description: room.description,
      roomCode: room.roomCode,
      ownerId: room.ownerId,
      owner: {
        id: owner?.id || room.ownerId,
        username: owner?.username || "owner",
        name: owner?.name || "Trưởng phòng",
        avatar: owner?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80",
        isVerified: owner?.isVerified ?? false,
      },
      avatar: room.avatar || owner?.avatar,
      members: room.members,
      membersList,
      pendingRequests: isOwner ? pendingRequestsFormatted : [],
      isRequireApproval: room.isRequireApproval,
      isOwner,
      isMember,
      isPending,
      membersCount: room.members.length,
      pendingCount: room.pendingRequests.length,
      lastMessage: lastMessageInfo,
      createdAt: room.createdAt,
    };
  }

  getChatMessageWithDetails(msg: StoredChatMessage, currentUserId?: string) {
    const sender = this.findUserById(msg.senderId);
    const room = this.chatRooms.find((r) => r.id === msg.roomId);
    const reactions = msg.reactions || [];
    const reactionsSummary = this.getReactionSummary(reactions);
    const userReaction = currentUserId ? reactions.find((r) => r.userId === currentUserId)?.type || null : null;

    return {
      id: msg.id,
      roomId: msg.roomId,
      senderId: msg.senderId,
      sender: {
        id: sender?.id || msg.senderId,
        username: sender?.username || "user",
        name: sender?.name || "Thành viên",
        avatar: sender?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80",
        isVerified: sender?.isVerified ?? false,
        isOwner: room ? room.ownerId === msg.senderId : false,
      },
      content: msg.content,
      image: msg.image,
      reactions,
      userReaction,
      reactionsSummary,
      createdAt: msg.createdAt,
    };
  }
}

const db = new Database();

const ACCOUNT_DELETION_GRACE_PERIOD_MS = 3 * 24 * 3600 * 1000; // 3 days
const ACCOUNT_CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // run every hour

// Permanently removes accounts that have been marked for deletion for
// longer than the grace period (3 days).
function cleanupDeletedAccounts() {
  const now = Date.now();
  const usersToDelete = db.users.filter((u) => {
    if (!u.markedForDeletion || !u.deletionRequestedAt) return false;
    return now - new Date(u.deletionRequestedAt).getTime() > ACCOUNT_DELETION_GRACE_PERIOD_MS;
  });

  if (usersToDelete.length === 0) return;

  const deletedIds = new Set(usersToDelete.map((u) => u.id));

  db.users = db.users.filter((u) => !deletedIds.has(u.id));

  // Clean up related data & references to the deleted users
  db.posts = db.posts.filter((p) => !deletedIds.has(p.authorId));
  db.comments = db.comments.filter((c) => !deletedIds.has(c.authorId));
  db.users.forEach((u) => {
    u.followers = u.followers.filter((id) => !deletedIds.has(id));
    u.following = u.following.filter((id) => !deletedIds.has(id));
  });

  usersToDelete.forEach((u) => {
    console.log(`🧹 Đã xóa vĩnh viễn tài khoản ${u.username} (${u.id}) sau thời gian ân hạn 3 ngày.`);
  });
}

// Auth Middleware
interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
  username?: string;
}

const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ success: false, error: "Vui lòng đăng nhập để thực hiện hành động này (Missing Token)" });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string; username: string };
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    req.username = decoded.username;
    next();
  } catch {
    res.status(403).json({ success: false, error: "Phiên đăng nhập đã hết hạn hoặc không hợp lệ" });
    return;
  }
};

// Optional auth middleware (for feed if user is logged in vs visitor)
const optionalAuthenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string; username: string };
      req.userId = decoded.userId;
      req.userEmail = decoded.email;
      req.username = decoded.username;
    } catch {
      // ignore token error in optional mode
    }
  }
  next();
};

async function startServer() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "15mb" }));
  app.use(express.urlencoded({ extended: true, limit: "15mb" }));

  // ==========================================
  // AUTHENTICATION ROUTES
  // ==========================================

  // 1. Register
  app.post("/api/auth/register", (req: Request, res: Response): void => {
    try {
      const { username, email, password, name, bio, avatar } = req.body;

      if (!username || !email || !password || !name) {
        res.status(400).json({ success: false, error: "Vui lòng điền đầy đủ: Tên đăng nhập, Email, Mật khẩu và Họ tên" });
        return;
      }

      // Check existing email or username
      const existingEmail = db.findUserByEmail(email);
      if (existingEmail) {
        res.status(400).json({ success: false, error: "Email này đã được sử dụng bởi tài khoản khác" });
        return;
      }

      const existingUsername = db.findUserByUsername(username);
      if (existingUsername) {
        res.status(400).json({ success: false, error: "Tên đăng nhập (username) này đã tồn tại, vui lòng chọn tên khác" });
        return;
      }

      // Hash password with bcrypt
      const salt = bcrypt.genSaltSync(10);
      const passwordHash = bcrypt.hashSync(password, salt);

      const newUser: StoredUser = {
        id: `user-${Date.now()}`,
        username: username.toLowerCase().trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        name: name.trim(),
        avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
        coverImage: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&auto=format&fit=crop&q=80",
        bio: bio || "Xin chào! Mình là thành viên mới của ConnectSphere.",
        followers: [],
        following: ["user-1"], // Auto follow founder Mai Hải Đăng as welcoming friend
        createdAt: new Date().toISOString(),
      };

      // Add following relationship
      const founder = db.findUserById("user-1");
      if (founder && !founder.followers.includes(newUser.id)) {
        founder.followers.push(newUser.id);
      }

      db.users.push(newUser);

      // Create JWT Token
      const token = jwt.sign(
        { userId: newUser.id, email: newUser.email, username: newUser.username },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.status(201).json({
        success: true,
        message: "Đăng ký tài khoản thành công!",
        data: {
          token,
          user: db.sanitizeUser(newUser),
        },
      });
    } catch (error) {
      console.error("Register Error:", error);
      res.status(500).json({ success: false, error: "Đã xảy ra lỗi máy chủ trong quá trình đăng ký" });
    }
  });

  // 2. Login
  app.post("/api/auth/login", (req: Request, res: Response): void => {
    try {
      const { identifier, password } = req.body; // identifier can be email or username

      if (!identifier || !password) {
        res.status(400).json({ success: false, error: "Vui lòng nhập email/tên đăng nhập và mật khẩu" });
        return;
      }

      const user = db.findUserByEmail(identifier) || db.findUserByUsername(identifier);

      if (!user) {
        res.status(401).json({ success: false, error: "Tài khoản hoặc mật khẩu không chính xác" });
        return;
      }

      // Compare password with bcrypt
      const isPasswordValid = bcrypt.compareSync(password, user.passwordHash);
      if (!isPasswordValid) {
        res.status(401).json({ success: false, error: "Tài khoản hoặc mật khẩu không chính xác" });
        return;
      }

      // If the account was marked for deletion, logging in again cancels the request
      let deletionCancelled = false;
      if (user.markedForDeletion) {
        user.markedForDeletion = false;
        user.deletionRequestedAt = undefined;
        deletionCancelled = true;
        console.log(`♻️  Yêu cầu xóa tài khoản của ${user.username} (${user.id}) đã được hủy do đăng nhập lại.`);
      }

      // Create JWT Token
      const token = jwt.sign(
        { userId: user.id, email: user.email, username: user.username },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.json({
        success: true,
        message: deletionCancelled
          ? "Đăng nhập thành công! Yêu cầu xóa tài khoản của bạn đã được hủy."
          : "Đăng nhập thành công!",
        deletionCancelled,
        data: {
          token,
          user: db.sanitizeUser(user),
        },
      });
    } catch (error) {
      console.error("Login Error:", error);
      res.status(500).json({ success: false, error: "Đã xảy ra lỗi máy chủ trong quá trình đăng nhập" });
    }
  });

  // 3. Get Current User Profile via Token
  app.get("/api/auth/me", authenticateToken, (req: AuthRequest, res: Response): void => {
    const user = db.findUserById(req.userId!);
    if (!user) {
      res.status(404).json({ success: false, error: "Không tìm thấy người dùng" });
      return;
    }
    res.json({
      success: true,
      data: db.sanitizeUser(user),
    });
  });

  // 4. Quick Demo Users List (Excludes Admin haidang_dev so only admin can access via login)
  app.get("/api/auth/demo-users", (req: Request, res: Response): void => {
    const sanitized = db.users
      .filter((u) => u.username !== "haidang_dev" && u.role !== "admin")
      .map((u) => ({
        ...db.sanitizeUser(u),
        defaultPassword: "123456",
      }));
    res.json({ success: true, data: sanitized });
  });

  // 5. Change Password
  app.post("/api/auth/change-password", authenticateToken, (req: AuthRequest, res: Response): void => {
    try {
      const { oldPassword, newPassword } = req.body;

      if (!oldPassword || !newPassword) {
        res.status(400).json({ success: false, error: "Vui lòng nhập mật khẩu cũ và mật khẩu mới" });
        return;
      }

      if (String(newPassword).length < 6) {
        res.status(400).json({ success: false, error: "Mật khẩu mới phải có ít nhất 6 ký tự" });
        return;
      }

      const user = db.findUserById(req.userId!);
      if (!user) {
        res.status(404).json({ success: false, error: "Không tìm thấy người dùng" });
        return;
      }

      const isOldPasswordValid = bcrypt.compareSync(oldPassword, user.passwordHash);
      if (!isOldPasswordValid) {
        res.status(401).json({ success: false, error: "Mật khẩu cũ không chính xác" });
        return;
      }

      const salt = bcrypt.genSaltSync(10);
      user.passwordHash = bcrypt.hashSync(newPassword, salt);

      res.json({ success: true, message: "Đổi mật khẩu thành công!" });
    } catch (error) {
      console.error("Change Password Error:", error);
      res.status(500).json({ success: false, error: "Đã xảy ra lỗi máy chủ trong quá trình đổi mật khẩu" });
    }
  });

  // ==========================================
  // USER PROFILE & SOCIAL GRAPH ROUTES
  // ==========================================

  // Request Account Deletion (soft delete with 3-day grace period)
  app.post("/api/users/delete-request", authenticateToken, (req: AuthRequest, res: Response): void => {
    try {
      const user = db.findUserById(req.userId!);
      if (!user) {
        res.status(404).json({ success: false, error: "Không tìm thấy người dùng" });
        return;
      }

      user.markedForDeletion = true;
      user.deletionRequestedAt = new Date().toISOString();

      console.log(`🗑️  Tài khoản ${user.username} (${user.id}) đã yêu cầu xóa lúc ${user.deletionRequestedAt}`);

      res.json({
        success: true,
        message: "Tài khoản của bạn sẽ bị xóa trong 3 ngày. Đăng nhập lại để hủy yêu cầu.",
      });
    } catch (error) {
      console.error("Delete Request Error:", error);
      res.status(500).json({ success: false, error: "Đã xảy ra lỗi máy chủ trong quá trình yêu cầu xóa tài khoản" });
    }
  });

  // Get User Profile by ID or Username
  app.get("/api/users/:id", optionalAuthenticate, (req: AuthRequest, res: Response): void => {
    const { id } = req.params;
    const targetUser = db.findUserById(id) || db.findUserByUsername(id);

    if (!targetUser) {
      res.status(404).json({ success: false, error: "Không tìm thấy người dùng" });
      return;
    }

    const currentUserId = req.userId;
    const isFollowing = currentUserId ? targetUser.followers.includes(currentUserId) : false;
    const isFollowedBy = currentUserId ? targetUser.following.includes(currentUserId) : false;
    const isFriend = currentUserId ? db.isFriends(currentUserId, targetUser.id) : false;
    const isSelf = currentUserId === targetUser.id;
    const friendsCount = db.getFriendsCount(targetUser.id);

    // Get user's posts count (accessible to viewer)
    const postsCount = db.posts.filter((p) => p.authorId === targetUser.id && db.canViewPost(p, currentUserId, currentUserId ? db.findUserById(currentUserId)?.role : undefined)).length;

    res.json({
      success: true,
      data: {
        ...db.sanitizeUser(targetUser),
        followersCount: targetUser.followers.length,
        followingCount: targetUser.following.length,
        friendsCount,
        postsCount,
        isFollowing,
        isFollowedBy,
        isFriend,
        isSelf,
      },
    });
  });

  // Update Profile
  app.put("/api/users/profile", authenticateToken, (req: AuthRequest, res: Response): void => {
    const user = db.findUserById(req.userId!);
    if (!user) {
      res.status(404).json({ success: false, error: "Không tìm thấy người dùng" });
      return;
    }

    const { name, bio, avatar, coverImage, location, website } = req.body;

    if (name) user.name = name.trim();
    if (bio !== undefined) user.bio = bio.trim();
    if (avatar) user.avatar = avatar;
    if (coverImage) user.coverImage = coverImage;
    if (location !== undefined) user.location = location;
    if (website !== undefined) user.website = website;

    res.json({
      success: true,
      message: "Cập nhật thông tin cá nhân thành công",
      data: db.sanitizeUser(user),
    });
  });

  // Change Password
  app.put("/api/users/change-password", authenticateToken, (req: AuthRequest, res: Response): void => {
    try {
      const user = db.findUserById(req.userId!);
      if (!user) {
        res.status(404).json({ success: false, error: "Không tìm thấy người dùng" });
        return;
      }

      const { currentPassword, newPassword, confirmPassword } = req.body;

      if (!currentPassword || !newPassword) {
        res.status(400).json({ success: false, error: "Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới" });
        return;
      }

      if (newPassword.length < 6) {
        res.status(400).json({ success: false, error: "Mật khẩu mới phải có ít nhất 6 ký tự" });
        return;
      }

      if (confirmPassword && newPassword !== confirmPassword) {
        res.status(400).json({ success: false, error: "Xác nhận mật khẩu mới không trùng khớp" });
        return;
      }

      // Check current password
      const isMatch = bcrypt.compareSync(currentPassword, user.passwordHash);
      if (!isMatch) {
        res.status(400).json({ success: false, error: "Mật khẩu hiện tại không chính xác" });
        return;
      }

      // Update password hash
      user.passwordHash = bcrypt.hashSync(newPassword, 10);

      // Create notification
      db.createNotification({
        recipientId: user.id,
        type: "system",
        title: "Bảo mật tài khoản",
        content: "Mật khẩu tài khoản của bạn đã được thay đổi thành công.",
        targetType: "profile",
      });

      res.json({
        success: true,
        message: "Đổi mật khẩu thành công!",
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Đổi mật khẩu thất bại";
      res.status(500).json({ success: false, error: errorMsg });
    }
  });

  // Delete Account
  app.delete("/api/users/account", authenticateToken, (req: AuthRequest, res: Response): void => {
    try {
      const userId = req.userId!;
      const user = db.findUserById(userId);
      if (!user) {
        res.status(404).json({ success: false, error: "Không tìm thấy người dùng" });
        return;
      }

      const { password } = req.body;
      if (!password) {
        res.status(400).json({ success: false, error: "Vui lòng nhập mật khẩu xác nhận để xóa tài khoản" });
        return;
      }

      const isMatch = bcrypt.compareSync(password, user.passwordHash);
      if (!isMatch) {
        res.status(400).json({ success: false, error: "Mật khẩu xác nhận không chính xác" });
        return;
      }

      // 1. Remove user from followers & following of all other users
      db.users.forEach((u) => {
        u.followers = u.followers.filter((id) => id !== userId);
        u.following = u.following.filter((id) => id !== userId);
      });

      // 2. Remove user from chat rooms
      db.chatRooms.forEach((r) => {
        r.members = r.members.filter((id) => id !== userId);
        r.pendingRequests = r.pendingRequests.filter((p) => p.userId !== userId);
      });

      // 3. Delete user's verification requests
      db.verificationRequests = db.verificationRequests.filter((r) => r.userId !== userId);

      // 4. Delete user's notifications
      db.notifications = db.notifications.filter((n) => n.recipientId !== userId && n.senderId !== userId);

      // 5. Delete the user from database
      const userIndex = db.users.findIndex((u) => u.id === userId);
      if (userIndex > -1) {
        db.users.splice(userIndex, 1);
      }

      res.json({
        success: true,
        message: "Tài khoản của bạn đã được xóa vĩnh viễn khỏi hệ thống.",
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Xóa tài khoản thất bại";
      res.status(500).json({ success: false, error: errorMsg });
    }
  });

  // ==========================================
  // VERIFICATION (TICK XANH) REQUEST & ADMIN WORKFLOW
  // ==========================================

  // 1. Regular User: Submit Verification Request
  app.post("/api/verification/request", authenticateToken, (req: AuthRequest, res: Response): void => {
    try {
      const userId = req.userId!;
      const user = db.findUserById(userId);
      if (!user) {
        res.status(404).json({ success: false, error: "Không tìm thấy người dùng" });
        return;
      }

      if (user.isVerified) {
        res.status(400).json({ success: false, error: "Tài khoản của bạn đã có Tick Xanh xác minh chính chủ" });
        return;
      }

      // Check if there is already a pending request
      const existingPending = db.verificationRequests.find(
        (r) => r.userId === userId && r.status === "pending"
      );
      if (existingPending) {
        res.status(400).json({
          success: false,
          error: "Bạn đã có một yêu cầu xác minh đang chờ Admin phê duyệt. Vui lòng kiên nhẫn chờ phản hồi!",
          data: db.getVerificationRequestWithDetails(existingPending),
        });
        return;
      }

      const { category, reason, evidenceUrl } = req.body;
      if (!category || !reason || !reason.trim()) {
        res.status(400).json({
          success: false,
          error: "Vui lòng chọn lĩnh vực hoạt động và nhập lý do xin cấp tick xanh",
        });
        return;
      }

      const newRequest: StoredVerificationRequest = {
        id: `vreq-${Date.now()}`,
        userId,
        category: category.trim(),
        reason: reason.trim(),
        evidenceUrl: evidenceUrl ? evidenceUrl.trim() : undefined,
        status: "pending",
        requestedAt: new Date().toISOString(),
      };

      db.verificationRequests.unshift(newRequest);

      // Notify all admins about new request
      const admins = db.users.filter((u) => u.role === "admin");
      admins.forEach((admin) => {
        db.createNotification({
          recipientId: admin.id,
          senderId: userId,
          type: "verification_requested",
          title: "Yêu cầu cấp Tick Xanh mới",
          content: `${user.name} (@${user.username}) vừa gửi yêu cầu xác minh tài khoản tick xanh danh mục "${category}".`,
          targetId: newRequest.id,
          targetType: "verification",
        });
      });

      res.status(201).json({
        success: true,
        message: "Đã gửi yêu cầu cấp tick xanh tới Ban Quản Trị thành công!",
        data: db.getVerificationRequestWithDetails(newRequest),
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Gửi yêu cầu thất bại";
      res.status(500).json({ success: false, error: errorMsg });
    }
  });

  // 2. Regular User: Get My Latest Verification Request
  app.get("/api/verification/my-request", authenticateToken, (req: AuthRequest, res: Response): void => {
    try {
      const userId = req.userId!;
      const latestReq = db.verificationRequests.find((r) => r.userId === userId);
      res.json({
        success: true,
        data: latestReq ? db.getVerificationRequestWithDetails(latestReq) : null,
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Không thể lấy thông tin yêu cầu";
      res.status(500).json({ success: false, error: errorMsg });
    }
  });

  // 3. Regular User: Cancel Pending Verification Request
  app.delete("/api/verification/my-request", authenticateToken, (req: AuthRequest, res: Response): void => {
    try {
      const userId = req.userId!;
      const reqIndex = db.verificationRequests.findIndex(
        (r) => r.userId === userId && r.status === "pending"
      );

      if (reqIndex === -1) {
        res.status(404).json({ success: false, error: "Không tìm thấy yêu cầu đang chờ xử lý" });
        return;
      }

      db.verificationRequests.splice(reqIndex, 1);
      res.json({
        success: true,
        message: "Đã hủy yêu cầu xác minh tài khoản",
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Không thể hủy yêu cầu";
      res.status(500).json({ success: false, error: errorMsg });
    }
  });

  // 4. Admin Only: Get All Verification Requests
  app.get("/api/admin/verification-requests", authenticateToken, (req: AuthRequest, res: Response): void => {
    try {
      const currentUser = db.findUserById(req.userId!);
      if (!currentUser || currentUser.role !== "admin") {
        res.status(403).json({ success: false, error: "Chỉ Quản trị viên (Admin) mới có quyền truy cập danh sách này" });
        return;
      }

      const { status } = req.query;
      let requests = [...db.verificationRequests];

      if (status && status !== "all") {
        requests = requests.filter((r) => r.status === status);
      }

      const result = requests.map((r) => db.getVerificationRequestWithDetails(r));
      res.json({
        success: true,
        data: result,
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Không thể lấy danh sách yêu cầu";
      res.status(500).json({ success: false, error: errorMsg });
    }
  });

  // 5. Admin Only: Approve Verification Request
  app.post("/api/admin/verification-requests/:id/approve", authenticateToken, (req: AuthRequest, res: Response): void => {
    try {
      const currentUser = db.findUserById(req.userId!);
      if (!currentUser || currentUser.role !== "admin") {
        res.status(403).json({ success: false, error: "Chỉ Quản trị viên (Admin) mới có quyền phê duyệt tick xanh" });
        return;
      }

      const request = db.verificationRequests.find((r) => r.id === req.params.id);
      if (!request) {
        res.status(404).json({ success: false, error: "Không tìm thấy yêu cầu xác minh" });
        return;
      }

      const targetUser = db.findUserById(request.userId);
      if (!targetUser) {
        res.status(404).json({ success: false, error: "Người dùng không tồn tại" });
        return;
      }

      // Update request & grant verified badge
      request.status = "approved";
      request.reviewedBy = currentUser.name;
      request.reviewedAt = new Date().toISOString();
      if (req.body.adminNotes) {
        request.adminNotes = req.body.adminNotes.trim();
      }

      targetUser.isVerified = true;

      // Send congratulations notification to user
      db.createNotification({
        recipientId: targetUser.id,
        senderId: currentUser.id,
        type: "verification_approved",
        title: "Xác minh tài khoản thành công! 🎉",
        content: `Chúc mừng bạn! Admin ${currentUser.name} đã phê duyệt cấp Tick Xanh chính chủ cho tài khoản của bạn trên StageBiz.`,
        targetId: targetUser.id,
        targetType: "profile",
      });

      res.json({
        success: true,
        message: `Đã phê duyệt và cấp Tick Xanh cho người dùng @${targetUser.username}`,
        data: {
          request: db.getVerificationRequestWithDetails(request),
          user: db.sanitizeUser(targetUser),
        },
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Phê duyệt thất bại";
      res.status(500).json({ success: false, error: errorMsg });
    }
  });

  // 6. Admin Only: Reject Verification Request
  app.post("/api/admin/verification-requests/:id/reject", authenticateToken, (req: AuthRequest, res: Response): void => {
    try {
      const currentUser = db.findUserById(req.userId!);
      if (!currentUser || currentUser.role !== "admin") {
        res.status(403).json({ success: false, error: "Chỉ Quản trị viên (Admin) mới có quyền từ chối yêu cầu" });
        return;
      }

      const request = db.verificationRequests.find((r) => r.id === req.params.id);
      if (!request) {
        res.status(404).json({ success: false, error: "Không tìm thấy yêu cầu xác minh" });
        return;
      }

      const targetUser = db.findUserById(request.userId);

      const { adminNotes } = req.body;
      request.status = "rejected";
      request.adminNotes = adminNotes ? adminNotes.trim() : "Hồ sơ chưa đủ điều kiện cấp tick xanh theo quy định hiện hành của cộng đồng.";
      request.reviewedBy = currentUser.name;
      request.reviewedAt = new Date().toISOString();

      if (targetUser) {
        db.createNotification({
          recipientId: targetUser.id,
          senderId: currentUser.id,
          type: "verification_rejected",
          title: "Thông báo về yêu cầu cấp Tick Xanh",
          content: `Yêu cầu xác minh tài khoản của bạn chưa được duyệt. Lý do: ${request.adminNotes}`,
          targetId: targetUser.id,
          targetType: "profile",
        });
      }

      res.json({
        success: true,
        message: `Đã từ chối yêu cầu xác minh của @${targetUser?.username || "người dùng"}`,
        data: db.getVerificationRequestWithDetails(request),
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Từ chối thất bại";
      res.status(500).json({ success: false, error: errorMsg });
    }
  });

  // 7. Admin Only: Revoke or Direct Grant Tick Xanh for User
  app.post("/api/admin/users/:id/revoke-verification", authenticateToken, (req: AuthRequest, res: Response): void => {
    try {
      const currentUser = db.findUserById(req.userId!);
      if (!currentUser || currentUser.role !== "admin") {
        res.status(403).json({ success: false, error: "Chỉ Quản trị viên (Admin) mới có quyền thu hồi tick xanh" });
        return;
      }

      const targetUser = db.findUserById(req.params.id);
      if (!targetUser) {
        res.status(404).json({ success: false, error: "Không tìm thấy người dùng" });
        return;
      }

      targetUser.isVerified = false;

      const reason = req.body.reason ? req.body.reason.trim() : "Quyết định từ Ban Quản Trị hệ thống";

      db.createNotification({
        recipientId: targetUser.id,
        senderId: currentUser.id,
        type: "system",
        title: "Thu hồi Tick Xanh xác minh",
        content: `Ban Quản Trị đã thu hồi Tick Xanh xác minh tài khoản của bạn. Lý do: ${reason}`,
        targetId: targetUser.id,
        targetType: "profile",
      });

      res.json({
        success: true,
        message: `Đã thu hồi Tick Xanh của @${targetUser.username}`,
        data: db.sanitizeUser(targetUser),
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Thu hồi thất bại";
      res.status(500).json({ success: false, error: errorMsg });
    }
  });

  // 8. Admin Direct Grant Verification
  app.post("/api/admin/users/:id/grant-verification", authenticateToken, (req: AuthRequest, res: Response): void => {
    try {
      const currentUser = db.findUserById(req.userId!);
      if (!currentUser || currentUser.role !== "admin") {
        res.status(403).json({ success: false, error: "Chỉ Quản trị viên (Admin) mới có quyền cấp trực tiếp tick xanh" });
        return;
      }

      const targetUser = db.findUserById(req.params.id);
      if (!targetUser) {
        res.status(404).json({ success: false, error: "Không tìm thấy người dùng" });
        return;
      }

      targetUser.isVerified = true;

      db.createNotification({
        recipientId: targetUser.id,
        senderId: currentUser.id,
        type: "verification_approved",
        title: "Cấp Tick Xanh xác minh 🎉",
        content: `Admin ${currentUser.name} đã cấp Tick Xanh xác minh chính chủ cho tài khoản của bạn trên StageBiz.`,
        targetId: targetUser.id,
        targetType: "profile",
      });

      res.json({
        success: true,
        message: `Đã cấp Tick Xanh cho @${targetUser.username}`,
        data: db.sanitizeUser(targetUser),
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Cấp tick xanh thất bại";
      res.status(500).json({ success: false, error: errorMsg });
    }
  });

  // Toggle Follow/Unfollow
  app.post("/api/users/:id/follow", authenticateToken, (req: AuthRequest, res: Response): void => {
    const targetUserId = req.params.id;
    const currentUserId = req.userId!;

    if (targetUserId === currentUserId) {
      res.status(400).json({ success: false, error: "Bạn không thể tự theo dõi chính mình" });
      return;
    }

    const targetUser = db.findUserById(targetUserId);
    const currentUser = db.findUserById(currentUserId);

    if (!targetUser || !currentUser) {
      res.status(404).json({ success: false, error: "Người dùng không tồn tại" });
      return;
    }

    const isFollowing = currentUser.following.includes(targetUserId);

    if (isFollowing) {
      // Unfollow
      currentUser.following = currentUser.following.filter((id) => id !== targetUserId);
      targetUser.followers = targetUser.followers.filter((id) => id !== currentUserId);
    } else {
      // Follow
      currentUser.following.push(targetUserId);
      targetUser.followers.push(currentUserId);

      // Check if this became mutual friendship
      const isMutual = targetUser.following.includes(currentUserId);

      if (isMutual) {
        // Notification for target user: Became friends!
        db.createNotification({
          recipientId: targetUserId,
          senderId: currentUserId,
          type: "friend",
          title: "Bạn bè mới 🤝",
          content: `${currentUser.name} (@${currentUser.username}) đã theo dõi lại bạn. Hai bạn giờ đã là Bạn bè!`,
          targetId: currentUserId,
          targetType: "profile",
        });

        // Notification for current user: Became friends!
        db.createNotification({
          recipientId: currentUserId,
          senderId: targetUserId,
          type: "friend",
          title: "Bạn bè mới 🤝",
          content: `Bạn và ${targetUser.name} (@${targetUser.username}) đã cùng theo dõi nhau và trở thành Bạn bè!`,
          targetId: targetUserId,
          targetType: "profile",
        });
      } else {
        // Simple follow notification
        db.createNotification({
          recipientId: targetUserId,
          senderId: currentUserId,
          type: "follow",
          title: "Người theo dõi mới",
          content: `${currentUser.name} (@${currentUser.username}) đã bắt đầu theo dõi bạn.`,
          targetId: currentUserId,
          targetType: "profile",
        });
      }
    }

    const isNowFriend = db.isFriends(currentUserId, targetUserId);

    res.json({
      success: true,
      message: isFollowing 
        ? `Đã bỏ theo dõi @${targetUser.username}` 
        : isNowFriend 
          ? `Bạn và @${targetUser.username} đã trở thành Bạn bè! 🤝`
          : `Đang theo dõi @${targetUser.username}`,
      data: {
        isFollowing: !isFollowing,
        isFriend: isNowFriend,
        targetFollowersCount: targetUser.followers.length,
        currentFollowingCount: currentUser.following.length,
        friendsCount: db.getFriendsCount(currentUser.id),
      },
    });
  });

  // Get Followers list of a user
  app.get("/api/users/:id/followers", optionalAuthenticate, (req: AuthRequest, res: Response): void => {
    const targetUser = db.findUserById(req.params.id);
    if (!targetUser) {
      res.status(404).json({ success: false, error: "Người dùng không tồn tại" });
      return;
    }

    const currentUserId = req.userId;
    const followers = targetUser.followers
      .map((id) => db.findUserById(id))
      .filter((u): u is StoredUser => Boolean(u))
      .map((u) => ({
        ...db.sanitizeUser(u),
        isFollowing: currentUserId ? u.followers.includes(currentUserId) : false,
        isFriend: currentUserId ? db.isFriends(currentUserId, u.id) : false,
        friendsCount: db.getFriendsCount(u.id),
      }));

    res.json({ success: true, data: followers });
  });

  // Get Following list of a user
  app.get("/api/users/:id/following", optionalAuthenticate, (req: AuthRequest, res: Response): void => {
    const targetUser = db.findUserById(req.params.id);
    if (!targetUser) {
      res.status(404).json({ success: false, error: "Người dùng không tồn tại" });
      return;
    }

    const currentUserId = req.userId;
    const following = targetUser.following
      .map((id) => db.findUserById(id))
      .filter((u): u is StoredUser => Boolean(u))
      .map((u) => ({
        ...db.sanitizeUser(u),
        isFollowing: currentUserId ? u.followers.includes(currentUserId) : false,
        isFriend: currentUserId ? db.isFriends(currentUserId, u.id) : false,
        friendsCount: db.getFriendsCount(u.id),
      }));

    res.json({ success: true, data: following });
  });

  // Suggested Users to follow
  app.get("/api/users/suggested", optionalAuthenticate, (req: AuthRequest, res: Response): void => {
    const currentUserId = req.userId;
    const currentUser = currentUserId ? db.findUserById(currentUserId) : null;

    let suggested = db.users.filter((u) => u.id !== currentUserId);

    if (currentUser) {
      // Prioritize users not yet followed
      suggested = suggested.filter((u) => !currentUser.following.includes(u.id));
    }

    const result = suggested.slice(0, 5).map((u) => ({
      ...db.sanitizeUser(u),
      followersCount: u.followers.length,
      isFollowing: false,
      isFriend: false,
      friendsCount: db.getFriendsCount(u.id),
    }));

    res.json({ success: true, data: result });
  });

  // Search users
  app.get("/api/users/search", optionalAuthenticate, (req: AuthRequest, res: Response): void => {
    const query = String(req.query.q || "").toLowerCase().trim();
    const currentUserId = req.userId;
    if (!query) {
      res.json({ success: true, data: [] });
      return;
    }

    const matches = db.users
      .filter((u) => u.name.toLowerCase().includes(query) || u.username.toLowerCase().includes(query))
      .slice(0, 10)
      .map((u) => ({
        ...db.sanitizeUser(u),
        isFollowing: currentUserId ? u.followers.includes(currentUserId) : false,
        isFriend: currentUserId ? db.isFriends(currentUserId, u.id) : false,
        friendsCount: db.getFriendsCount(u.id),
      }));

    res.json({ success: true, data: matches });
  });

  // ==========================================
  // POSTS & INTERACTIONS ROUTES
  // ==========================================

  // Get Newsfeed / Posts
  app.get("/api/posts", optionalAuthenticate, (req: AuthRequest, res: Response): void => {
    const { tab, userId, search } = req.query;
    const currentUserId = req.userId;
    const currentUser = currentUserId ? db.findUserById(currentUserId) : null;
    const userRole = currentUser?.role;

    let filtered = [...db.posts];

    // Filter by visibility / privacy permissions FIRST
    filtered = filtered.filter((p) => db.canViewPost(p, currentUserId, userRole));

    // Filter by specific user (e.g. Profile tab)
    if (userId) {
      filtered = filtered.filter((p) => p.authorId === userId);
    }

    // Filter by tab:
    // - "friends": Posts by mutual friends or currentUser
    // - "following": Posts by users followed by currentUser or currentUser
    // - "for-you" (Đề xuất) / default: All visible posts across network
    if (tab === "friends" && currentUser) {
      filtered = filtered.filter((p) => p.authorId === currentUser.id || db.isFriends(currentUser.id, p.authorId));
    } else if (tab === "following" && currentUser) {
      const allowedAuthors = [currentUser.id, ...currentUser.following];
      filtered = filtered.filter((p) => allowedAuthors.includes(p.authorId));
    }

    // Filter by search keyword / hashtag
    if (search) {
      const q = String(search).toLowerCase();
      filtered = filtered.filter((p) => p.content.toLowerCase().includes(q));
    }

    // Sort by latest first
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const result = filtered.map((post) => {
      return db.getPostWithDetails(post, currentUserId);
    });

    res.json({ success: true, data: result });
  });

  // Get Single Post
  app.get("/api/posts/:id", optionalAuthenticate, (req: AuthRequest, res: Response): void => {
    const post = db.posts.find((p) => p.id === req.params.id);
    if (!post) {
      res.status(404).json({ success: false, error: "Không tìm thấy bài viết" });
      return;
    }

    const currentUserId = req.userId;
    const currentUser = currentUserId ? db.findUserById(currentUserId) : null;
    if (!db.canViewPost(post, currentUserId, currentUser?.role)) {
      res.status(403).json({ success: false, error: "Bạn không có quyền xem bài viết này" });
      return;
    }

    res.json({
      success: true,
      data: db.getPostWithDetails(post, currentUserId),
    });
  });

  // Create Post
  app.post("/api/posts", authenticateToken, (req: AuthRequest, res: Response): void => {
    const { content, image, images, visibility } = req.body;

    const normalizedImages: string[] = Array.isArray(images) && images.length > 0
      ? images.filter(Boolean)
      : image
        ? [image]
        : [];

    if ((!content || !content.trim()) && normalizedImages.length === 0) {
      res.status(400).json({ success: false, error: "Nội dung bài viết hoặc hình ảnh không được để trống" });
      return;
    }

    const validVisibilities: PostVisibility[] = ["public", "followers", "friends", "private"];
    const postVisibility: PostVisibility = validVisibilities.includes(visibility) ? visibility : "public";

    const newPost: StoredPost = {
      id: `post-${Date.now()}`,
      authorId: req.userId!,
      content: (content || "").trim(),
      image: normalizedImages[0] || undefined,
      images: normalizedImages.length > 0 ? normalizedImages : undefined,
      visibility: postVisibility,
      likes: [],
      reactions: [],
      sharesCount: 0,
      createdAt: new Date().toISOString(),
    };

    db.posts.unshift(newPost);

    res.status(201).json({
      success: true,
      message: "Đăng bài viết thành công!",
      data: db.getPostWithDetails(newPost, req.userId),
    });
  });

  // Edit Post
  app.put("/api/posts/:id", authenticateToken, (req: AuthRequest, res: Response): void => {
    const post = db.posts.find((p) => p.id === req.params.id);
    if (!post) {
      res.status(404).json({ success: false, error: "Không tìm thấy bài viết" });
      return;
    }

    if (post.authorId !== req.userId) {
      res.status(403).json({ success: false, error: "Bạn chỉ có thể chỉnh sửa bài viết của chính mình" });
      return;
    }

    const { content, image, images, visibility } = req.body;
    const normalizedImages: string[] | undefined = Array.isArray(images)
      ? images.filter(Boolean)
      : image !== undefined
        ? (image ? [image] : [])
        : undefined;

    if ((!content || !content.trim()) && (!normalizedImages || normalizedImages.length === 0) && !post.image && (!post.images || post.images.length === 0)) {
      res.status(400).json({ success: false, error: "Nội dung bài viết không được để trống" });
      return;
    }

    post.content = (content || "").trim();
    if (normalizedImages !== undefined) {
      post.images = normalizedImages;
      post.image = normalizedImages[0] || undefined;
    }
    if (visibility) {
      const validVisibilities: PostVisibility[] = ["public", "followers", "friends", "private"];
      if (validVisibilities.includes(visibility)) {
        post.visibility = visibility;
      }
    }
    post.updatedAt = new Date().toISOString();

    res.json({
      success: true,
      message: "Cập nhật bài viết thành công!",
      data: db.getPostWithDetails(post, req.userId),
    });
  });

  // Delete Post
  app.delete("/api/posts/:id", authenticateToken, (req: AuthRequest, res: Response): void => {
    const postIndex = db.posts.findIndex((p) => p.id === req.params.id);
    if (postIndex === -1) {
      res.status(404).json({ success: false, error: "Không tìm thấy bài viết" });
      return;
    }

    const post = db.posts[postIndex];
    if (post.authorId !== req.userId) {
      res.status(403).json({ success: false, error: "Bạn chỉ có quyền xóa bài viết của chính mình" });
      return;
    }

    // Delete post & associated comments
    db.posts.splice(postIndex, 1);
    db.comments = db.comments.filter((c) => c.postId !== post.id);

    res.json({ success: true, message: "Đã xóa bài viết thành công!" });
  });

  // Post Reaction (Like, Love, Haha, Wow, Sad, Angry)
  app.post("/api/posts/:id/react", authenticateToken, (req: AuthRequest, res: Response): void => {
    const post = db.posts.find((p) => p.id === req.params.id);
    if (!post) {
      res.status(404).json({ success: false, error: "Không tìm thấy bài viết" });
      return;
    }

    const userId = req.userId!;
    const requestedType: ReactionType = req.body.type || "like";
    const validTypes: ReactionType[] = ["like", "love", "haha", "wow", "sad", "angry"];
    const reactionType = validTypes.includes(requestedType) ? requestedType : "like";

    if (!post.reactions) {
      post.reactions = (post.likes || []).map((id) => ({ userId: id, type: "like" }));
    }

    const existingIndex = post.reactions.findIndex((r) => r.userId === userId);
    let userReaction: ReactionType | null = null;

    if (existingIndex > -1) {
      if (post.reactions[existingIndex].type === reactionType) {
        // Toggle off if same reaction clicked
        post.reactions.splice(existingIndex, 1);
        userReaction = null;
      } else {
        // Change reaction type
        post.reactions[existingIndex].type = reactionType;
        userReaction = reactionType;
      }
    } else {
      // Add new reaction
      post.reactions.push({ userId, type: reactionType });
      userReaction = reactionType;

      // Trigger notification if reacting to another user's post
      if (post.authorId !== userId) {
        const actor = db.findUserById(userId);
        const reactionLabels: Record<ReactionType, string> = {
          like: "Thích",
          love: "Yêu thích",
          haha: "Haha",
          wow: "Wow",
          sad: "Buồn",
          angry: "Phẫn nộ",
        };
        db.createNotification({
          recipientId: post.authorId,
          senderId: userId,
          type: "reaction",
          title: "Tương tác mới",
          content: `${actor?.name || "Người dùng"} đã bày tỏ cảm xúc [${reactionLabels[reactionType]}] về bài viết của bạn.`,
          targetId: post.id,
          targetType: "post",
        });
      }
    }

    // Keep post.likes array in sync
    post.likes = post.reactions.map((r) => r.userId);

    const reactionsSummary = db.getReactionSummary(post.reactions);

    res.json({
      success: true,
      message: userReaction ? `Đã bày tỏ cảm xúc` : "Đã gỡ cảm xúc",
      data: {
        userReaction,
        reactionsSummary,
        reactions: post.reactions,
        likes: post.likes,
        likesCount: post.likes.length,
        isLiked: Boolean(userReaction),
      },
    });
  });

  // Backward-compatible Like / Unlike Post
  app.post("/api/posts/:id/like", authenticateToken, (req: AuthRequest, res: Response): void => {
    const post = db.posts.find((p) => p.id === req.params.id);
    if (!post) {
      res.status(404).json({ success: false, error: "Không tìm thấy bài viết" });
      return;
    }

    const userId = req.userId!;
    if (!post.reactions) {
      post.reactions = (post.likes || []).map((id) => ({ userId: id, type: "like" }));
    }

    const existingIndex = post.reactions.findIndex((r) => r.userId === userId);
    let userReaction: ReactionType | null = null;

    if (existingIndex > -1) {
      post.reactions.splice(existingIndex, 1);
      userReaction = null;
    } else {
      post.reactions.push({ userId, type: "like" });
      userReaction = "like";
    }

    post.likes = post.reactions.map((r) => r.userId);
    const reactionsSummary = db.getReactionSummary(post.reactions);

    res.json({
      success: true,
      message: userReaction ? "Đã thích bài viết" : "Đã bỏ thích bài viết",
      data: {
        userReaction,
        reactionsSummary,
        reactions: post.reactions,
        likes: post.likes,
        likesCount: post.likes.length,
        isLiked: Boolean(userReaction),
      },
    });
  });

  // Get users who reacted to a post (View who liked/hearted)
  app.get("/api/posts/:id/reactions", optionalAuthenticate, (req: AuthRequest, res: Response): void => {
    const post = db.posts.find((p) => p.id === req.params.id);
    if (!post) {
      res.status(404).json({ success: false, error: "Không tìm thấy bài viết" });
      return;
    }

    const currentUserId = req.userId;
    const currentUser = currentUserId ? db.findUserById(currentUserId) : null;

    if (!post.reactions) {
      post.reactions = (post.likes || []).map((id) => ({ userId: id, type: "like" as ReactionType }));
    }

    const reactionsSummary = db.getReactionSummary(post.reactions);

    const users = post.reactions
      .map((r) => {
        const u = db.findUserById(r.userId);
        if (!u) return null;
        return {
          id: u.id,
          username: u.username,
          name: u.name,
          avatar: u.avatar,
          bio: u.bio,
          isVerified: u.isVerified ?? false,
          role: u.role || "user",
          type: r.type,
          isFollowing: currentUser ? currentUser.following.includes(u.id) : false,
          isFriend: currentUser ? db.isFriends(currentUser.id, u.id) : false,
          createdAt: r.createdAt || post.createdAt,
        };
      })
      .filter(Boolean);

    res.json({
      success: true,
      data: {
        users,
        reactionsSummary,
        total: users.length,
      },
    });
  });

  // Share Post (Quick Share or Share to Personal Profile / Timeline)
  app.post("/api/posts/:id/share", optionalAuthenticate, (req: AuthRequest, res: Response): void => {
    const post = db.posts.find((p) => p.id === req.params.id);
    if (!post) {
      res.status(404).json({ success: false, error: "Không tìm thấy bài viết" });
      return;
    }

    const { content, shareToProfile, visibility } = req.body || {};

    if (shareToProfile) {
      const currentUserId = req.userId;
      if (!currentUserId) {
        res.status(401).json({ success: false, error: "Vui lòng đăng nhập để chia sẻ bài viết lên trang cá nhân" });
        return;
      }

      const currentUser = db.findUserById(currentUserId);
      if (!currentUser) {
        res.status(404).json({ success: false, error: "Người dùng không tồn tại" });
        return;
      }

      // If user shares a share, point to the source root post or this post
      const targetOriginalId = post.originalPostId || post.id;
      const originalTargetPost = db.posts.find((p) => p.id === targetOriginalId) || post;

      const validVisibilities: PostVisibility[] = ["public", "followers", "friends", "private"];
      const postVisibility: PostVisibility = validVisibilities.includes(visibility) ? visibility : "public";

      const newPost: StoredPost = {
        id: `post-${Date.now()}`,
        authorId: currentUserId,
        content: (content || "").trim(),
        originalPostId: targetOriginalId,
        visibility: postVisibility,
        likes: [],
        reactions: [],
        sharesCount: 0,
        createdAt: new Date().toISOString(),
      };

      db.posts.unshift(newPost);

      // Increment shares on original post
      originalTargetPost.sharesCount = (originalTargetPost.sharesCount || 0) + 1;
      if (post.id !== originalTargetPost.id) {
        post.sharesCount = (post.sharesCount || 0) + 1;
      }

      // Notify original author if not self
      if (originalTargetPost.authorId !== currentUserId) {
        db.createNotification({
          recipientId: originalTargetPost.authorId,
          senderId: currentUserId,
          type: "share_post",
          title: "Chia sẻ bài viết",
          content: `${currentUser.name} (@${currentUser.username}) đã chia sẻ bài viết của bạn về trang cá nhân.`,
          targetId: newPost.id,
          targetType: "post",
        });
      }

      res.status(201).json({
        success: true,
        message: "Đã chia sẻ bài viết về trang cá nhân thành công!",
        data: {
          newPost: db.getPostWithDetails(newPost, currentUserId),
          sharesCount: post.sharesCount,
        },
      });
      return;
    }

    // Standard Quick Share / Link copy count
    post.sharesCount = (post.sharesCount || 0) + 1;
    res.json({
      success: true,
      message: "Đã chia sẻ bài viết",
      data: { sharesCount: post.sharesCount },
    });
  });

  // ==========================================
  // COMMENTS & REPLIES ROUTES
  // ==========================================

  // Get Comments for Post (including nested replies & user reactions)
  app.get("/api/posts/:id/comments", optionalAuthenticate, (req: AuthRequest, res: Response): void => {
    const post = db.posts.find((p) => p.id === req.params.id);
    if (!post) {
      res.status(404).json({ success: false, error: "Không tìm thấy bài viết" });
      return;
    }

    const currentUserId = req.userId;
    const postComments = db.comments
      .filter((c) => c.postId === post.id)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    // Format all comments
    const formatted = postComments.map((c) => db.getCommentWithDetails(c, currentUserId));

    // Structure with replies array for top-level comments
    const topLevelComments: (typeof formatted[0] & { replies?: typeof formatted })[] = [];
    const replyMap = new Map<string, typeof formatted>();

    formatted.forEach((c) => {
      if (c.parentId) {
        const existingReplies = replyMap.get(c.parentId) || [];
        existingReplies.push(c);
        replyMap.set(c.parentId, existingReplies);
      }
    });

    formatted.forEach((c) => {
      if (!c.parentId) {
        topLevelComments.push({
          ...c,
          replies: replyMap.get(c.id) || [],
        });
      }
    });

    res.json({
      success: true,
      data: topLevelComments,
      allComments: formatted,
    });
  });

  // Add Comment or Reply
  app.post("/api/posts/:id/comments", authenticateToken, (req: AuthRequest, res: Response): void => {
    const post = db.posts.find((p) => p.id === req.params.id);
    if (!post) {
      res.status(404).json({ success: false, error: "Không tìm thấy bài viết" });
      return;
    }

    const { content, parentId, replyToUserId } = req.body;
    if (!content || !content.trim()) {
      res.status(400).json({ success: false, error: "Nội dung bình luận không được để trống" });
      return;
    }

    let replyToUser = null;
    if (replyToUserId) {
      const targetUser = db.findUserById(replyToUserId);
      if (targetUser) {
        replyToUser = {
          id: targetUser.id,
          name: targetUser.name,
          username: targetUser.username,
        };
      }
    } else if (parentId) {
      const parentComment = db.comments.find((c) => c.id === parentId);
      if (parentComment) {
        const targetUser = db.findUserById(parentComment.authorId);
        if (targetUser) {
          replyToUser = {
            id: targetUser.id,
            name: targetUser.name,
            username: targetUser.username,
          };
        }
      }
    }

    const newComment: StoredComment = {
      id: `comment-${Date.now()}`,
      postId: post.id,
      parentId: parentId || null,
      replyToUser,
      authorId: req.userId!,
      content: content.trim(),
      reactions: [],
      createdAt: new Date().toISOString(),
    };

    db.comments.push(newComment);

    const commenter = db.findUserById(req.userId!);

    // Notification for post author (if not commenting on own post)
    if (post.authorId !== req.userId) {
      db.createNotification({
        recipientId: post.authorId,
        senderId: req.userId!,
        type: "comment",
        title: "Bình luận mới trên bài viết",
        content: `${commenter?.name || "Người dùng"} đã bình luận: "${content.slice(0, 60)}${content.length > 60 ? "..." : ""}"`,
        targetId: post.id,
        targetType: "post",
      });
    }

    // Notification for reply recipient (if replying to someone else)
    if (replyToUser && replyToUser.id !== req.userId && replyToUser.id !== post.authorId) {
      db.createNotification({
        recipientId: replyToUser.id,
        senderId: req.userId!,
        type: "reply",
        title: "Phản hồi bình luận",
        content: `${commenter?.name || "Người dùng"} đã trả lời bình luận của bạn: "${content.slice(0, 60)}${content.length > 60 ? "..." : ""}"`,
        targetId: post.id,
        targetType: "post",
      });
    }

    const formattedComment = {
      ...db.getCommentWithDetails(newComment, req.userId),
      replies: [],
    };

    res.status(201).json({
      success: true,
      message: parentId ? "Đã gửi câu trả lời!" : "Đã thêm bình luận!",
      data: formattedComment,
    });
  });

  // React to Comment (Like, Love, Haha, Wow, Sad, Angry)
  app.post("/api/posts/:postId/comments/:commentId/react", authenticateToken, (req: AuthRequest, res: Response): void => {
    const { postId, commentId } = req.params;
    const comment = db.comments.find((c) => c.id === commentId && c.postId === postId);

    if (!comment) {
      res.status(404).json({ success: false, error: "Không tìm thấy bình luận" });
      return;
    }

    const userId = req.userId!;
    const requestedType: ReactionType = req.body.type || "like";
    const validTypes: ReactionType[] = ["like", "love", "haha", "wow", "sad", "angry"];
    const reactionType = validTypes.includes(requestedType) ? requestedType : "like";

    if (!comment.reactions) {
      comment.reactions = [];
    }

    const existingIndex = comment.reactions.findIndex((r) => r.userId === userId);
    let userReaction: ReactionType | null = null;

    if (existingIndex > -1) {
      if (comment.reactions[existingIndex].type === reactionType) {
        comment.reactions.splice(existingIndex, 1);
        userReaction = null;
      } else {
        comment.reactions[existingIndex].type = reactionType;
        userReaction = reactionType;
      }
    } else {
      comment.reactions.push({ userId, type: reactionType });
      userReaction = reactionType;
    }

    const reactionsSummary = db.getReactionSummary(comment.reactions);

    res.json({
      success: true,
      message: userReaction ? "Đã bày tỏ cảm xúc với bình luận" : "Đã gỡ cảm xúc bình luận",
      data: {
        userReaction,
        reactionsSummary,
        reactions: comment.reactions,
        totalReactions: comment.reactions.length,
      },
    });
  });

  // Delete Comment
  app.delete("/api/posts/:postId/comments/:commentId", authenticateToken, (req: AuthRequest, res: Response): void => {
    const { postId, commentId } = req.params;
    const commentIndex = db.comments.findIndex((c) => c.id === commentId && c.postId === postId);

    if (commentIndex === -1) {
      res.status(404).json({ success: false, error: "Không tìm thấy bình luận" });
      return;
    }

    const comment = db.comments[commentIndex];
    const post = db.posts.find((p) => p.id === postId);

    // Comment can be deleted by comment author OR post owner
    if (comment.authorId !== req.userId && post?.authorId !== req.userId) {
      res.status(403).json({ success: false, error: "Bạn không có quyền xóa bình luận này" });
      return;
    }

    // Delete this comment and any direct replies to it
    db.comments = db.comments.filter((c) => c.id !== commentId && c.parentId !== commentId);
    res.json({ success: true, message: "Đã xóa bình luận" });
  });

  // ==========================================
  // CHAT ROOMS & APPROVAL SYSTEM ROUTES
  // ==========================================

  // 1. Get all accessible Chat Rooms
  app.get("/api/chat/rooms", optionalAuthenticate, (req: AuthRequest, res: Response): void => {
    const currentUserId = req.userId;
    const roomsFormatted = db.chatRooms.map((room) => db.getChatRoomWithDetails(room, currentUserId));

    // Sort: user joined/owned rooms first, then other rooms, then recently created
    roomsFormatted.sort((a, b) => {
      const aJoined = a.isMember || a.isOwner ? 1 : 0;
      const bJoined = b.isMember || b.isOwner ? 1 : 0;
      if (aJoined !== bJoined) return bJoined - aJoined;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    res.json({
      success: true,
      data: roomsFormatted,
    });
  });

  // 2. Get Single Chat Room details
  app.get("/api/chat/rooms/:id", optionalAuthenticate, (req: AuthRequest, res: Response): void => {
    const room = db.chatRooms.find((r) => r.id === req.params.id);
    if (!room) {
      res.status(404).json({ success: false, error: "Không tìm thấy phòng chat" });
      return;
    }

    res.json({
      success: true,
      data: db.getChatRoomWithDetails(room, req.userId),
    });
  });

  // 3. Create New Chat Room (Creator is Trưởng phòng / Room Owner)
  app.post("/api/chat/rooms", authenticateToken, (req: AuthRequest, res: Response): void => {
    try {
      const { name, description, roomCode, isRequireApproval = true, avatar } = req.body;
      const userId = req.userId!;

      if (!name || !name.trim()) {
        res.status(400).json({ success: false, error: "Vui lòng nhập tên phòng chat" });
        return;
      }

      // Generate or clean room code (uppercase alphanumeric)
      let cleanCode = (roomCode || "").trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
      if (!cleanCode) {
        cleanCode = `ROOM${Math.floor(1000 + Math.random() * 9000)}`;
      }

      // Check for code uniqueness
      const existingRoomWithCode = db.chatRooms.find((r) => r.roomCode.toUpperCase() === cleanCode);
      if (existingRoomWithCode) {
        res.status(400).json({
          success: false,
          error: `Mã phòng "${cleanCode}" đã tồn tại. Vui lòng chọn một mã khác!`,
        });
        return;
      }

      const newRoom: StoredChatRoom = {
        id: `room-${Date.now()}`,
        name: name.trim(),
        description: description ? description.trim() : undefined,
        roomCode: cleanCode,
        ownerId: userId,
        avatar: avatar || undefined,
        members: [userId], // Creator is the first member
        pendingRequests: [],
        isRequireApproval: Boolean(isRequireApproval),
        createdAt: new Date().toISOString(),
      };

      db.chatRooms.unshift(newRoom);

      // Add welcoming system message
      const creator = db.findUserById(userId);
      db.chatMessages.push({
        id: `msg-${Date.now()}`,
        roomId: newRoom.id,
        senderId: userId,
        content: `🎉 ${creator?.name || "Trưởng phòng"} đã tạo phòng chat "${newRoom.name}". Mã tham gia: [ ${newRoom.roomCode} ]`,
        createdAt: new Date().toISOString(),
      });

      res.status(201).json({
        success: true,
        message: `Đã tạo phòng chat "${newRoom.name}" thành công!`,
        data: db.getChatRoomWithDetails(newRoom, userId),
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Không thể tạo phòng chat";
      res.status(500).json({ success: false, error: errorMsg });
    }
  });

  // 4. Join Room by Room Code (with Approval Workflow)
  app.post("/api/chat/rooms/join-by-code", authenticateToken, (req: AuthRequest, res: Response): void => {
    try {
      const { code, message } = req.body;
      const userId = req.userId!;

      if (!code || !code.trim()) {
        res.status(400).json({ success: false, error: "Vui lòng nhập mã tham gia phòng chat" });
        return;
      }

      const cleanCode = code.trim().toUpperCase();
      const room = db.chatRooms.find((r) => r.roomCode.toUpperCase() === cleanCode);

      if (!room) {
        res.status(404).json({
          success: false,
          error: `Không tìm thấy phòng chat với mã "${cleanCode}". Vui lòng kiểm tra lại mã!`,
        });
        return;
      }

      // Check if user is already a member
      if (room.members.includes(userId)) {
        res.json({
          success: true,
          status: "already_member",
          message: `Bạn đã là thành viên của phòng "${room.name}"`,
          data: db.getChatRoomWithDetails(room, userId),
        });
        return;
      }

      // Check if user has already sent a pending request
      const existingRequestIndex = room.pendingRequests.findIndex((p) => p.userId === userId);
      if (existingRequestIndex > -1) {
        res.json({
          success: true,
          status: "already_pending",
          message: `Yêu cầu tham gia của bạn đang chờ Trưởng phòng duyệt!`,
          data: db.getChatRoomWithDetails(room, userId),
        });
        return;
      }

      // If room requires approval from Trưởng phòng
      if (room.isRequireApproval) {
        room.pendingRequests.push({
          userId,
          message: message ? message.trim() : undefined,
          requestedAt: new Date().toISOString(),
        });

        // Notify room owner (Trưởng phòng)
        const requestingUser = db.findUserById(userId);
        db.createNotification({
          recipientId: room.ownerId,
          senderId: userId,
          type: "chat_request",
          title: "Yêu cầu vào phòng chat mới",
          content: `${requestingUser?.name || "Một thành viên"} đã xin gia nhập box chat "${room.name}". Vui lòng xem xét phê duyệt.`,
          targetId: room.id,
          targetType: "chat_room",
        });

        res.json({
          success: true,
          status: "pending_approval",
          message: `Đã gửi yêu cầu tham gia phòng "${room.name}". Vui lòng chờ Trưởng phòng duyệt!`,
          data: db.getChatRoomWithDetails(room, userId),
        });
      } else {
        // Direct join without approval requirement
        room.members.push(userId);

        const joiningUser = db.findUserById(userId);
        db.chatMessages.push({
          id: `msg-${Date.now()}`,
          roomId: room.id,
          senderId: userId,
          content: `👋 ${joiningUser?.name || "Người dùng"} vừa tham gia phòng chat.`,
          createdAt: new Date().toISOString(),
        });

        res.json({
          success: true,
          status: "joined",
          message: `Chào mừng bạn đã tham gia phòng "${room.name}"!`,
          data: db.getChatRoomWithDetails(room, userId),
        });
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Không thể tham gia phòng chat";
      res.status(500).json({ success: false, error: errorMsg });
    }
  });

  // 5. Trưởng phòng approves a pending request
  app.post("/api/chat/rooms/:id/requests/:userId/approve", authenticateToken, (req: AuthRequest, res: Response): void => {
    try {
      const { id, userId: targetUserId } = req.params;
      const currentUserId = req.userId!;

      const room = db.chatRooms.find((r) => r.id === id);
      if (!room) {
        res.status(404).json({ success: false, error: "Không tìm thấy phòng chat" });
        return;
      }

      // Verify caller is the Trưởng phòng (Owner)
      if (room.ownerId !== currentUserId) {
        res.status(403).json({
          success: false,
          error: "Chỉ Trưởng phòng mới có quyền phê duyệt thành viên vào nhóm",
        });
        return;
      }

      const reqIndex = room.pendingRequests.findIndex((p) => p.userId === targetUserId);
      if (reqIndex === -1) {
        res.status(400).json({
          success: false,
          error: "Yêu cầu tham gia không tồn tại hoặc đã được xử lý",
        });
        return;
      }

      // Remove from pending
      room.pendingRequests.splice(reqIndex, 1);

      // Add to members if not already there
      if (!room.members.includes(targetUserId)) {
        room.members.push(targetUserId);
      }

      const approvedUser = db.findUserById(targetUserId);
      const ownerUser = db.findUserById(currentUserId);

      // Create announcement in room
      db.chatMessages.push({
        id: `msg-${Date.now()}`,
        roomId: room.id,
        senderId: currentUserId,
        content: `✨ Trưởng phòng ${ownerUser?.name || ""} đã duyệt thành viên ${approvedUser?.name || "mới"} vào box chat! Hãy cùng gửi lời chào nhé 👋`,
        createdAt: new Date().toISOString(),
      });

      // Send direct notification to target user
      db.createNotification({
        recipientId: targetUserId,
        senderId: currentUserId,
        type: "chat_approved",
        title: "Được duyệt vào box chat! 🎉",
        content: `Trưởng phòng ${ownerUser?.name || ""} đã duyệt yêu cầu tham gia box chat "${room.name}" của bạn. Bắt đầu trò chuyện ngay!`,
        targetId: room.id,
        targetType: "chat_room",
      });

      res.json({
        success: true,
        message: `Đã duyệt thành viên ${approvedUser?.name || ""} vào phòng chat thành công!`,
        data: db.getChatRoomWithDetails(room, currentUserId),
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Không thể duyệt yêu cầu";
      res.status(500).json({ success: false, error: errorMsg });
    }
  });

  // 6. Trưởng phòng rejects a pending request
  app.post("/api/chat/rooms/:id/requests/:userId/reject", authenticateToken, (req: AuthRequest, res: Response): void => {
    try {
      const { id, userId: targetUserId } = req.params;
      const currentUserId = req.userId!;

      const room = db.chatRooms.find((r) => r.id === id);
      if (!room) {
        res.status(404).json({ success: false, error: "Không tìm thấy phòng chat" });
        return;
      }

      if (room.ownerId !== currentUserId) {
        res.status(403).json({
          success: false,
          error: "Chỉ Trưởng phòng mới có quyền từ chối yêu cầu tham gia",
        });
        return;
      }

      room.pendingRequests = room.pendingRequests.filter((p) => p.userId !== targetUserId);

      const ownerUser = db.findUserById(currentUserId);
      db.createNotification({
        recipientId: targetUserId,
        senderId: currentUserId,
        type: "chat_rejected",
        title: "Yêu cầu vào box chat",
        content: `Yêu cầu tham gia box chat "${room.name}" của bạn chưa được Trưởng phòng duyệt.`,
        targetId: room.id,
        targetType: "chat_room",
      });

      res.json({
        success: true,
        message: "Đã từ chối yêu cầu tham gia",
        data: db.getChatRoomWithDetails(room, currentUserId),
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Không thể từ chối yêu cầu";
      res.status(500).json({ success: false, error: errorMsg });
    }
  });

  // 7. Remove member or Leave Room
  app.post("/api/chat/rooms/:id/members/:userId/remove", authenticateToken, (req: AuthRequest, res: Response): void => {
    try {
      const { id, userId: targetUserId } = req.params;
      const currentUserId = req.userId!;

      const room = db.chatRooms.find((r) => r.id === id);
      if (!room) {
        res.status(404).json({ success: false, error: "Không tìm thấy phòng chat" });
        return;
      }

      // Can remove if: user is leaving themselves, or user is the room owner
      if (currentUserId !== targetUserId && room.ownerId !== currentUserId) {
        res.status(403).json({
          success: false,
          error: "Bạn không có quyền xóa thành viên này",
        });
        return;
      }

      // Owner cannot leave their own room without deleting it
      if (targetUserId === room.ownerId) {
        res.status(400).json({
          success: false,
          error: "Trưởng phòng không thể rời phòng. Bạn có thể chọn Giải tán phòng chat.",
        });
        return;
      }

      room.members = room.members.filter((m) => m !== targetUserId);

      const targetUser = db.findUserById(targetUserId);
      const isSelf = currentUserId === targetUserId;

      db.chatMessages.push({
        id: `msg-${Date.now()}`,
        roomId: room.id,
        senderId: currentUserId,
        content: isSelf
          ? `🚪 ${targetUser?.name || "Một thành viên"} đã rời khỏi phòng chat.`
          : `⚠️ Trưởng phòng đã xóa ${targetUser?.name || "một thành viên"} khỏi phòng chat.`,
        createdAt: new Date().toISOString(),
      });

      res.json({
        success: true,
        message: isSelf ? "Bạn đã rời khỏi phòng chat" : `Đã xóa ${targetUser?.name || "thành viên"} khỏi phòng`,
        data: db.getChatRoomWithDetails(room, currentUserId),
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Không thể xử lý yêu cầu";
      res.status(500).json({ success: false, error: errorMsg });
    }
  });

  // 8. Delete / Dissolve Room (Owner only)
  app.delete("/api/chat/rooms/:id", authenticateToken, (req: AuthRequest, res: Response): void => {
    try {
      const { id } = req.params;
      const currentUserId = req.userId!;

      const roomIndex = db.chatRooms.findIndex((r) => r.id === id);
      if (roomIndex === -1) {
        res.status(404).json({ success: false, error: "Không tìm thấy phòng chat" });
        return;
      }

      const room = db.chatRooms[roomIndex];
      if (room.ownerId !== currentUserId) {
        res.status(403).json({
          success: false,
          error: "Chỉ Trưởng phòng mới có quyền giải tán phòng chat này",
        });
        return;
      }

      db.chatRooms.splice(roomIndex, 1);
      // Clean up room messages
      db.chatMessages = db.chatMessages.filter((m) => m.roomId !== id);

      res.json({
        success: true,
        message: `Đã giải tán phòng chat "${room.name}" thành công`,
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Không thể xóa phòng chat";
      res.status(500).json({ success: false, error: errorMsg });
    }
  });

  // 9. Get Messages for a Room
  app.get("/api/chat/rooms/:id/messages", authenticateToken, (req: AuthRequest, res: Response): void => {
    try {
      const { id } = req.params;
      const currentUserId = req.userId!;

      const room = db.chatRooms.find((r) => r.id === id);
      if (!room) {
        res.status(404).json({ success: false, error: "Không tìm thấy phòng chat" });
        return;
      }

      // Check if user is member or owner
      if (!room.members.includes(currentUserId) && room.ownerId !== currentUserId) {
        res.status(403).json({
          success: false,
          error: "Bạn cần là thành viên đã được Trưởng phòng duyệt để xem tin nhắn trong phòng này",
        });
        return;
      }

      const messages = db.chatMessages
        .filter((m) => m.roomId === id)
        .map((m) => db.getChatMessageWithDetails(m, currentUserId));

      res.json({
        success: true,
        data: messages,
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Không thể tải tin nhắn";
      res.status(500).json({ success: false, error: errorMsg });
    }
  });

  // 10. Send a Message in Room
  app.post("/api/chat/rooms/:id/messages", authenticateToken, (req: AuthRequest, res: Response): void => {
    try {
      const { id } = req.params;
      const currentUserId = req.userId!;
      const { content, image } = req.body;

      if ((!content || !content.trim()) && !image) {
        res.status(400).json({ success: false, error: "Nội dung tin nhắn hoặc hình ảnh không được để trống" });
        return;
      }

      const room = db.chatRooms.find((r) => r.id === id);
      if (!room) {
        res.status(404).json({ success: false, error: "Không tìm thấy phòng chat" });
        return;
      }

      // Verify membership
      if (!room.members.includes(currentUserId) && room.ownerId !== currentUserId) {
        res.status(403).json({
          success: false,
          error: "Bạn chưa được Trưởng phòng duyệt tham gia vào phòng chat này",
        });
        return;
      }

      const newMessage: StoredChatMessage = {
        id: `msg-${Date.now()}`,
        roomId: id,
        senderId: currentUserId,
        content: (content || "").trim(),
        image: image || undefined,
        reactions: [],
        createdAt: new Date().toISOString(),
      };

      db.chatMessages.push(newMessage);

      res.status(201).json({
        success: true,
        data: db.getChatMessageWithDetails(newMessage, currentUserId),
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Không thể gửi tin nhắn";
      res.status(500).json({ success: false, error: errorMsg });
    }
  });

  // 11. React to a Chat Message
  app.post("/api/chat/rooms/:id/messages/:messageId/react", authenticateToken, (req: AuthRequest, res: Response): void => {
    try {
      const { id, messageId } = req.params;
      const currentUserId = req.userId!;
      const requestedType: ReactionType = req.body.type || "like";
      const validTypes: ReactionType[] = ["like", "love", "haha", "wow", "sad", "angry"];
      const reactionType = validTypes.includes(requestedType) ? requestedType : "like";

      const room = db.chatRooms.find((r) => r.id === id);
      if (!room) {
        res.status(404).json({ success: false, error: "Không tìm thấy phòng chat" });
        return;
      }

      if (!room.members.includes(currentUserId) && room.ownerId !== currentUserId) {
        res.status(403).json({ success: false, error: "Bạn không phải thành viên phòng chat này" });
        return;
      }

      const msg = db.chatMessages.find((m) => m.id === messageId && m.roomId === id);
      if (!msg) {
        res.status(404).json({ success: false, error: "Không tìm thấy tin nhắn" });
        return;
      }

      if (!msg.reactions) {
        msg.reactions = [];
      }

      const existingIndex = msg.reactions.findIndex((r) => r.userId === currentUserId);
      let userReaction: ReactionType | null = null;

      if (existingIndex > -1) {
        if (msg.reactions[existingIndex].type === reactionType) {
          msg.reactions.splice(existingIndex, 1);
          userReaction = null;
        } else {
          msg.reactions[existingIndex].type = reactionType;
          userReaction = reactionType;
        }
      } else {
        msg.reactions.push({ userId: currentUserId, type: reactionType });
        userReaction = reactionType;
      }

      const reactionsSummary = db.getReactionSummary(msg.reactions);

      res.json({
        success: true,
        data: {
          userReaction,
          reactionsSummary,
          reactions: msg.reactions,
        },
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Không thể bày tỏ cảm xúc";
      res.status(500).json({ success: false, error: errorMsg });
    }
  });

  // ==========================================
  // NOTIFICATIONS ROUTES
  // ==========================================

  // 1. Get current user's notifications
  app.get("/api/notifications", authenticateToken, (req: AuthRequest, res: Response): void => {
    try {
      const userId = req.userId!;
      const { unreadOnly, type } = req.query;

      let userNotifs = db.notifications.filter((n) => n.recipientId === userId);

      if (unreadOnly === "true") {
        userNotifs = userNotifs.filter((n) => !n.isRead);
      }

      if (type && type !== "all") {
        userNotifs = userNotifs.filter((n) => n.type === type);
      }

      // Sort latest first
      userNotifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const formatted = userNotifs.map((n) => db.getNotificationWithDetails(n));
      const unreadCount = db.notifications.filter((n) => n.recipientId === userId && !n.isRead).length;

      res.json({
        success: true,
        data: {
          notifications: formatted,
          unreadCount,
          total: formatted.length,
        },
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Không thể tải thông báo";
      res.status(500).json({ success: false, error: errorMsg });
    }
  });

  // 2. Mark single notification as read
  app.put("/api/notifications/:id/read", authenticateToken, (req: AuthRequest, res: Response): void => {
    try {
      const userId = req.userId!;
      const notif = db.notifications.find((n) => n.id === req.params.id && n.recipientId === userId);

      if (!notif) {
        res.status(404).json({ success: false, error: "Không tìm thấy thông báo" });
        return;
      }

      notif.isRead = true;
      const unreadCount = db.notifications.filter((n) => n.recipientId === userId && !n.isRead).length;

      res.json({
        success: true,
        data: {
          notification: db.getNotificationWithDetails(notif),
          unreadCount,
        },
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Không thể cập nhật trạng thái thông báo";
      res.status(500).json({ success: false, error: errorMsg });
    }
  });

  // 3. Mark all notifications as read
  app.put("/api/notifications/read-all", authenticateToken, (req: AuthRequest, res: Response): void => {
    try {
      const userId = req.userId!;
      db.notifications.forEach((n) => {
        if (n.recipientId === userId) {
          n.isRead = true;
        }
      });

      res.json({
        success: true,
        message: "Đã đánh dấu tất cả thông báo là đã đọc",
        data: { unreadCount: 0 },
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Không thể đánh dấu đã đọc";
      res.status(500).json({ success: false, error: errorMsg });
    }
  });

  // 4. Delete single notification
  app.delete("/api/notifications/:id", authenticateToken, (req: AuthRequest, res: Response): void => {
    try {
      const userId = req.userId!;
      const notifIndex = db.notifications.findIndex((n) => n.id === req.params.id && n.recipientId === userId);

      if (notifIndex === -1) {
        res.status(404).json({ success: false, error: "Không tìm thấy thông báo" });
        return;
      }

      db.notifications.splice(notifIndex, 1);
      const unreadCount = db.notifications.filter((n) => n.recipientId === userId && !n.isRead).length;

      res.json({
        success: true,
        message: "Đã xóa thông báo",
        data: { unreadCount },
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Không thể xóa thông báo";
      res.status(500).json({ success: false, error: errorMsg });
    }
  });

  // 5. Clear all notifications of user
  app.delete("/api/notifications", authenticateToken, (req: AuthRequest, res: Response): void => {
    try {
      const userId = req.userId!;
      db.notifications = db.notifications.filter((n) => n.recipientId !== userId);

      res.json({
        success: true,
        message: "Đã xóa toàn bộ thông báo",
        data: { unreadCount: 0 },
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Không thể xóa thông báo";
      res.status(500).json({ success: false, error: errorMsg });
    }
  });

  // ==========================================
  // VITE & STATIC FILES MIDDLEWARE
  // ==========================================
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Run account cleanup on startup, then periodically every hour
  cleanupDeletedAccounts();
  setInterval(cleanupDeletedAccounts, ACCOUNT_CLEANUP_INTERVAL_MS);

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 StageBiz Social Network server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
