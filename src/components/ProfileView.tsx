import React, { useState, useEffect, useCallback } from "react";
import { 
  MapPin, 
  Globe, 
  Calendar, 
  Edit3, 
  UserPlus, 
  UserCheck, 
  Grid, 
  FileText, 
  Heart,
  Share2,
  ShieldCheck,
  ShieldAlert,
  Settings,
  Clock,
  XCircle,
  Award,
  Shield,
  Users
} from "lucide-react";
import { User, Post, VerificationRequest } from "../types";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { PostCard } from "./PostCard";
import { EditProfileModal } from "./EditProfileModal";
import { FollowersListModal } from "./FollowersListModal";
import { VerifiedBadge } from "./VerifiedBadge";
import { SettingsModal } from "./SettingsModal";
import { VerificationModal } from "./VerificationModal";
import { AdminVerificationPanel } from "./AdminVerificationPanel";

interface ProfileViewProps {
  userId: string;
  onSelectUser: (userId: string) => void;
  onFilterHashtag: (tag: string) => void;
  onShowImageModal: (url: string, images?: string[], initialIndex?: number) => void;
  onShowToast: (text: string, type?: "success" | "error" | "info") => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  userId,
  onSelectUser,
  onFilterHashtag,
  onShowImageModal,
  onShowToast,
}) => {
  const { user: currentUser, isAuthenticated, openAuthModal, updateUserLocally } = useAuth();
  const [profileData, setProfileData] = useState<(User & { followersCount: number; followingCount: number; postsCount: number; isFollowing: boolean; isSelf: boolean }) | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [activeTab, setActiveTab] = useState<"posts" | "photos" | "admin_verification">("posts");
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  // Verification request status for self
  const [myVerificationRequest, setMyVerificationRequest] = useState<VerificationRequest | null>(null);
  const [isCancellingRequest, setIsCancellingRequest] = useState(false);

  // Modals state
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [followersModalState, setFollowersModalState] = useState<{ isOpen: boolean; type: "followers" | "following" }>({
    isOpen: false,
    type: "followers",
  });

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const [profile, posts] = await Promise.all([
        api.getUserProfile(userId),
        api.getPosts({ userId }),
      ]);
      setProfileData(profile);
      setUserPosts(posts);

      // If viewing self, load my verification request
      if (currentUser && (currentUser.id === userId || currentUser.username === userId)) {
        try {
          const req = await api.getMyVerificationRequest();
          setMyVerificationRequest(req);
        } catch {
          // silent
        }
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Tải thông tin thất bại";
      onShowToast(errorMsg, "error");
    } finally {
      setIsLoading(false);
    }
  }, [userId, currentUser, onShowToast]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleToggleFollow = async () => {
    if (!isAuthenticated) {
      openAuthModal("login");
      return;
    }
    if (!profileData) return;

    setIsFollowLoading(true);
    try {
      const res = await api.toggleFollow(profileData.id);
      setProfileData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          isFollowing: res.isFollowing,
          followersCount: res.targetFollowersCount,
        };
      });
      onShowToast(res.isFollowing ? `Đang theo dõi @${profileData.username}` : `Đã bỏ theo dõi @${profileData.username}`, "info");
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Thao tác thất bại";
      onShowToast(errorMsg, "error");
    } finally {
      setIsFollowLoading(false);
    }
  };

  // Admin action: Grant verification
  const handleAdminGrantVerification = async () => {
    if (!profileData) return;
    try {
      const updatedUser = await api.grantUserVerification(profileData.id);
      setProfileData((prev) => (prev ? { ...prev, isVerified: true } : null));
      onShowToast(`Đã cấp Tick Xanh cho @${updatedUser.username} thành công!`, "success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Cấp Tick Xanh thất bại";
      onShowToast(msg, "error");
    }
  };

  // Admin action: Revoke verification
  const handleAdminRevokeVerification = async () => {
    if (!profileData) return;
    const reason = window.prompt("Nhập lý do thu hồi Tick Xanh:", "Không còn thỏa mãn tiêu chuẩn xác minh tài khoản nghệ sĩ");
    if (reason === null) return;

    try {
      const updatedUser = await api.revokeUserVerification(profileData.id, reason);
      setProfileData((prev) => (prev ? { ...prev, isVerified: false } : null));
      onShowToast(`Đã thu hồi Tick Xanh của @${updatedUser.username}`, "info");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Thu hồi Tick Xanh thất bại";
      onShowToast(msg, "error");
    }
  };

  // User action: Cancel pending verification request
  const handleCancelVerificationRequest = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy hồ sơ xin cấp Tick Xanh này?")) return;
    setIsCancellingRequest(true);
    try {
      await api.cancelVerificationRequest();
      setMyVerificationRequest(null);
      onShowToast("Đã hủy hồ sơ xin cấp Tick Xanh", "info");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không thể hủy yêu cầu";
      onShowToast(msg, "error");
    } finally {
      setIsCancellingRequest(false);
    }
  };

  const handleProfileUpdated = (updatedUser: User) => {
    setProfileData((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        ...updatedUser,
      };
    });
    updateUserLocally(updatedUser);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm text-slate-500">Đang tải trang cá nhân...</p>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 text-center">
        <p className="text-base font-semibold text-slate-700 dark:text-slate-300">Không tìm thấy người dùng này</p>
      </div>
    );
  }

  const isSelf = currentUser?.id === profileData.id;
  const isAdmin = currentUser?.role === "admin";
  const mediaItems: { url: string; postId: string; likesCount: number; allImages: string[]; index: number }[] = [];
  userPosts.forEach((p) => {
    const imgs = p.images && p.images.length > 0 ? p.images : p.image ? [p.image] : [];
    imgs.forEach((img, idx) => {
      mediaItems.push({
        url: img,
        postId: p.id,
        likesCount: p.likes.length,
        allImages: imgs,
        index: idx,
      });
    });
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Profile Header Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 overflow-hidden shadow-xs">
        {/* Cover Banner */}
        <div className="relative h-44 sm:h-56 w-full bg-slate-900 overflow-hidden">
          <img
            src={profileData.coverImage || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80"}
            alt="Cover"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
        </div>

        {/* Profile Info Container */}
        <div className="px-5 sm:px-6 pb-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-16 sm:-mt-14 mb-4">
            {/* Avatar */}
            <div className="relative">
              <img
                src={profileData.avatar}
                alt={profileData.name}
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-white dark:border-slate-800 shadow-md bg-white"
              />
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
              {/* Verification Request Action for Self */}
              {isSelf && !profileData.isVerified && (
                <button
                  id="btn-request-verification-open"
                  onClick={() => setShowVerificationModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/60 transition-colors shadow-xs"
                  title="Gửi hồ sơ xin cấp Huy hiệu Xác minh chính chủ"
                >
                  <ShieldCheck className="w-4 h-4 text-sky-500" />
                  <span>Xin cấp Tick Xanh</span>
                </button>
              )}

              {/* Admin direct Grant/Revoke Controls when viewing another user */}
              {!isSelf && isAdmin && (
                <>
                  {profileData.isVerified ? (
                    <button
                      id="btn-admin-revoke-verification"
                      onClick={handleAdminRevokeVerification}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-100 transition-colors"
                      title="Quyền Admin: Thu hồi Tick Xanh"
                    >
                      <ShieldAlert className="w-4 h-4 text-rose-600" />
                      <span>Thu hồi Tick (Admin)</span>
                    </button>
                  ) : (
                    <button
                      id="btn-admin-grant-verification"
                      onClick={handleAdminGrantVerification}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-sky-500 hover:bg-sky-600 text-white shadow-xs transition-colors"
                      title="Quyền Admin: Cấp Tick Xanh trực tiếp"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Cấp Tick Xanh (Admin)</span>
                    </button>
                  )}
                </>
              )}

              {/* Self Actions: Edit Profile & Settings */}
              {isSelf ? (
                <>
                  <button
                    id="btn-edit-profile-open"
                    onClick={() => setShowEditModal(true)}
                    className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 text-xs font-semibold transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Sửa hồ sơ</span>
                  </button>

                  <button
                    id="btn-open-account-settings"
                    onClick={() => setShowSettingsModal(true)}
                    className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 text-xs font-semibold transition-colors"
                    title="Cài đặt đổi mật khẩu và bảo mật tài khoản"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Cài đặt & Bảo mật</span>
                  </button>
                </>
              ) : (
                <button
                  id="btn-profile-follow"
                  onClick={handleToggleFollow}
                  disabled={isFollowLoading}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    profileData.isFollowing
                      ? "bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-rose-50 hover:text-rose-600"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20"
                  }`}
                >
                  {profileData.isFollowing ? (
                    profileData.isFriend ? (
                      <>
                        <Users className="w-4 h-4 text-emerald-500" />
                        <span>Bạn bè</span>
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-4 h-4" />
                        <span>Đang theo dõi</span>
                      </>
                    )
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Theo dõi</span>
                    </>
                  )}
                </button>
              )}

              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  onShowToast("Đã sao chép liên kết trang cá nhân!", "success");
                }}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-600 dark:text-slate-300 transition-colors"
                title="Chia sẻ trang cá nhân"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Name & Bio */}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                {profileData.name}
              </h2>
              {profileData.isVerified && <VerifiedBadge size="md" showText={true} />}
              {profileData.isFriend && (
                <span className="inline-flex items-center gap-1 text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 rounded-full shadow-2xs">
                  <Users className="w-3 h-3" />
                  <span>Bạn bè</span>
                </span>
              )}
              {profileData.role === "admin" && (
                <span className="text-[10px] uppercase font-extrabold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Shield className="w-3 h-3 text-indigo-500" />
                  <span>Quản trị viên</span>
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-400 font-medium -mt-0.5">
              @{profileData.username}
            </p>

            {profileData.bio && (
              <p className="text-sm text-slate-700 dark:text-slate-300 mt-3 leading-relaxed max-w-2xl whitespace-pre-line">
                {profileData.bio}
              </p>
            )}

            {/* Meta tags */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-4">
              {profileData.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{profileData.location}</span>
                </div>
              )}
              {profileData.website && (
                <a
                  href={profileData.website}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-indigo-600 hover:underline"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>{profileData.website.replace(/^https?:\/\//, "")}</span>
                </a>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  Tham gia{" "}
                  {new Date(profileData.createdAt).toLocaleDateString("vi-VN", {
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>

            {/* Followers & Following Counters */}
            <div className="flex items-center gap-5 sm:gap-6 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/60 flex-wrap">
              <button
                onClick={() => setFollowersModalState({ isOpen: true, type: "following" })}
                className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors"
              >
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {profileData.followingCount}
                </span>
                <span className="text-xs text-slate-400">Đang theo dõi</span>
              </button>

              <button
                onClick={() => setFollowersModalState({ isOpen: true, type: "followers" })}
                className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors"
              >
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {profileData.followersCount}
                </span>
                <span className="text-xs text-slate-400">Người theo dõi</span>
              </button>

              {typeof profileData.friendsCount === "number" && (
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <span className="text-sm font-bold">
                    {profileData.friendsCount}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-400">Bạn bè</span>
                </div>
              )}

              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {userPosts.length}
                </span>
                <span className="text-xs text-slate-400">Bài viết</span>
              </div>
            </div>
          </div>
        </div>

        {/* Self Verification Request Status Banner */}
        {isSelf && myVerificationRequest && myVerificationRequest.status === "pending" && (
          <div className="mx-5 mb-5 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-amber-800 dark:text-amber-200">
              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <span className="font-bold">Hồ sơ xin cấp Tick Xanh đang chờ xét duyệt</span>
                <p className="text-[11px] text-amber-700 dark:text-amber-300">
                  Lĩnh vực: <strong>{myVerificationRequest.category}</strong> • Gửi lúc {new Date(myVerificationRequest.createdAt).toLocaleDateString("vi-VN")}
                </p>
              </div>
            </div>
            <button
              onClick={handleCancelVerificationRequest}
              disabled={isCancellingRequest}
              className="px-3 py-1 rounded-lg bg-amber-200 hover:bg-rose-100 hover:text-rose-700 dark:bg-amber-900 text-amber-900 dark:text-amber-100 text-xs font-semibold self-start sm:self-auto transition-colors"
            >
              {isCancellingRequest ? "Đang hủy..." : "Hủy yêu cầu"}
            </button>
          </div>
        )}

        {isSelf && myVerificationRequest && myVerificationRequest.status === "rejected" && !profileData.isVerified && (
          <div className="mx-5 mb-5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-start gap-2.5 text-rose-800 dark:text-rose-200">
              <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Yêu cầu cấp Tick Xanh trước đó chưa được chấp thuận</span>
                {myVerificationRequest.adminNotes && (
                  <p className="text-[11px] text-rose-700 dark:text-rose-300 mt-0.5">
                    Ghi chú từ Admin: {myVerificationRequest.adminNotes}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => setShowVerificationModal(true)}
              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold self-start sm:self-auto transition-colors shadow-xs"
            >
              Gửi lại hồ sơ mới
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 px-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab("posts")}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
              activeTab === "posts"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Bài viết ({userPosts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("photos")}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
              activeTab === "photos"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Grid className="w-4 h-4" />
            <span>Hình ảnh ({mediaItems.length})</span>
          </button>

          {/* Admin Verification Management Tab on Admin's own profile */}
          {isSelf && isAdmin && (
            <button
              id="tab-admin-verification-panel"
              onClick={() => setActiveTab("admin_verification")}
              className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
                activeTab === "admin_verification"
                  ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <Award className="w-4 h-4 text-sky-500" />
              <span>Duyệt Tick Xanh (Admin)</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === "posts" && (
        <div className="flex flex-col gap-4">
          {userPosts.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 text-center">
              <p className="text-sm text-slate-400">Người dùng này chưa có bài viết nào.</p>
            </div>
          ) : (
            userPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onPostUpdated={(updated) => {
                  setUserPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
                }}
                onPostDeleted={(postId) => {
                  setUserPosts((prev) => prev.filter((p) => p.id !== postId));
                }}
                onSelectUser={onSelectUser}
                onFilterHashtag={onFilterHashtag}
                onShowImageModal={onShowImageModal}
                onShowToast={onShowToast}
                onPostCreated={(newPost) => {
                  setUserPosts((prev) => [newPost, ...prev]);
                }}
              />
            ))
          )}
        </div>
      )}

      {activeTab === "photos" && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
          {mediaItems.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">Chưa có hình ảnh nào được đăng tải.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {mediaItems.map((item, idx) => (
                <div
                  key={`${item.postId}-${idx}`}
                  onClick={() => onShowImageModal(item.url, item.allImages, item.index)}
                  className="aspect-square rounded-xl overflow-hidden cursor-pointer group relative border border-slate-200 dark:border-slate-700 bg-slate-900/5"
                >
                  <img
                    src={item.url}
                    alt="Media post"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/60 text-white text-[9px] font-mono">
                    300x300
                  </div>
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 text-white text-xs font-semibold">
                    <span className="flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5 fill-white" /> {item.likesCount}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Admin Verification Management View */}
      {activeTab === "admin_verification" && isSelf && isAdmin && (
        <AdminVerificationPanel
          onSelectUser={onSelectUser}
          onShowToast={onShowToast}
        />
      )}

      {/* Edit Profile Modal */}
      {showEditModal && (
        <EditProfileModal
          user={profileData}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onProfileUpdated={handleProfileUpdated}
          onShowToast={onShowToast}
        />
      )}

      {/* Account Settings & Security Modal */}
      {showSettingsModal && (
        <SettingsModal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          onShowToast={onShowToast}
        />
      )}

      {/* Verification Request Modal for User */}
      {showVerificationModal && (
        <VerificationModal
          isOpen={showVerificationModal}
          onClose={() => setShowVerificationModal(false)}
          onSuccess={(newReq) => {
            setMyVerificationRequest(newReq);
          }}
          onShowToast={onShowToast}
        />
      )}

      {/* Followers / Following List Modal */}
      {followersModalState.isOpen && (
        <FollowersListModal
          userId={profileData.id}
          userName={profileData.name}
          type={followersModalState.type}
          isOpen={followersModalState.isOpen}
          onClose={() => setFollowersModalState({ ...followersModalState, isOpen: false })}
          onSelectUser={onSelectUser}
        />
      )}
    </div>
  );
};
