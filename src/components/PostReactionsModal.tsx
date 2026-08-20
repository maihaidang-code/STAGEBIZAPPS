import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { X, Heart, UserPlus, UserCheck, Loader2, Sparkles, Smile, Users } from "lucide-react";
import { PostReactionUser, ReactionSummary, ReactionType } from "../types";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { VerifiedBadge } from "./VerifiedBadge";
import { REACTIONS_DATA, ORDERED_REACTIONS } from "./Reactions";

interface PostReactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  onSelectUser: (userId: string) => void;
  onShowToast?: (text: string, type?: "success" | "error" | "info") => void;
}

export const PostReactionsModal: React.FC<PostReactionsModalProps> = ({
  isOpen,
  onClose,
  postId,
  onSelectUser,
  onShowToast,
}) => {
  const { user: currentUser, isAuthenticated, openAuthModal } = useAuth();
  const [users, setUsers] = useState<PostReactionUser[]>([]);
  const [summary, setSummary] = useState<ReactionSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<ReactionType | "all">("all");
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [actionLoadingMap, setActionLoadingMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!isOpen || !postId) return;

    let isMounted = true;
    setIsLoading(true);
    setActiveFilter("all");

    api
      .getPostReactions(postId)
      .then((res) => {
        if (!isMounted) return;
        setUsers(res.users || []);
        setSummary(res.reactionsSummary || null);
        const map: Record<string, boolean> = {};
        (res.users || []).forEach((u) => {
          map[u.id] = !!u.isFollowing;
        });
        setFollowingMap(map);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : "Không thể tải danh sách cảm xúc";
        if (onShowToast) onShowToast(msg, "error");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, postId, onShowToast]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const filteredUsers = useMemo(() => {
    if (activeFilter === "all") return users;
    return users.filter((u) => u.type === activeFilter);
  }, [users, activeFilter]);

  const handleToggleFollow = async (e: React.MouseEvent, targetUserId: string) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      openAuthModal("login");
      return;
    }
    if (currentUser?.id === targetUserId) return;

    setActionLoadingMap((prev) => ({ ...prev, [targetUserId]: true }));
    const prevStatus = !!followingMap[targetUserId];
    // Optimistic update
    setFollowingMap((prev) => ({ ...prev, [targetUserId]: !prevStatus }));

    try {
      const res = await api.toggleFollow(targetUserId);
      setFollowingMap((prev) => ({ ...prev, [targetUserId]: res.isFollowing }));
      if (onShowToast) {
        onShowToast(
          res.isFollowing ? "Đã theo dõi người dùng" : "Đã hủy theo dõi",
          "success"
        );
      }
    } catch (err: unknown) {
      setFollowingMap((prev) => ({ ...prev, [targetUserId]: prevStatus }));
      const msg = err instanceof Error ? err.message : "Thao tác thất bại";
      if (onShowToast) onShowToast(msg, "error");
    } finally {
      setActionLoadingMap((prev) => ({ ...prev, [targetUserId]: false }));
    }
  };

  if (!isOpen) return null;

  const totalCount = summary?.total ?? users.length;

  return createPortal(
    <div
      id="post-reactions-modal-backdrop"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="post-reactions-modal-container"
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">❤️</span>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Người đã bày tỏ cảm xúc
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {totalCount > 0 ? `${totalCount} lượt tương tác trên bài viết` : "Chưa có lượt tương tác nào"}
              </p>
            </div>
          </div>
          <button
            id="close-reactions-modal-btn"
            onClick={onClose}
            aria-label="Đóng"
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Reaction Filter Tabs */}
        <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 overflow-x-auto no-scrollbar shrink-0">
          <button
            type="button"
            onClick={() => setActiveFilter("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeFilter === "all"
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-slate-700"
            }`}
          >
            <span>Tất cả</span>
            <span className="text-[11px] px-1.5 py-0.2 bg-slate-200/60 dark:bg-slate-700/80 rounded-full">
              {totalCount}
            </span>
          </button>

          {ORDERED_REACTIONS.map((type) => {
            const count = summary ? summary[type] || 0 : 0;
            if (count <= 0 && (!summary || totalCount === 0)) return null;
            if (count === 0) return null;

            const config = REACTIONS_DATA[type];
            const isSelected = activeFilter === type;

            return (
              <button
                key={type}
                type="button"
                onClick={() => setActiveFilter(type)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-slate-700"
                }`}
              >
                <span>{config.emoji}</span>
                <span>{config.label}</span>
                <span
                  className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-500"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Body List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 divide-y divide-slate-100 dark:divide-slate-800/60">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
              <p className="text-sm">Đang tải danh sách người thả cảm xúc...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
              <Smile className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-2 stroke-[1.5]" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                Chưa có ai bày tỏ cảm xúc này
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                Hãy là người đầu tiên tương tác với bài viết nhé!
              </p>
            </div>
          ) : (
            filteredUsers.map((user) => {
              const reactionConfig = REACTIONS_DATA[user.type] || REACTIONS_DATA.like;
              const isSelf = currentUser?.id === user.id;
              const isFollowing = !!followingMap[user.id];
              const isActionLoading = !!actionLoadingMap[user.id];

              return (
                <div
                  key={`${user.id}-${user.type}`}
                  onClick={() => {
                    onSelectUser(user.id);
                    onClose();
                  }}
                  className="pt-2 first:pt-0 flex items-center justify-between gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Avatar with Reaction Badge overlay */}
                    <div className="relative shrink-0">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        referrerPolicy="no-referrer"
                        className="w-11 h-11 rounded-full object-cover ring-2 ring-slate-100 dark:ring-slate-750"
                      />
                      <span
                        className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs bg-white dark:bg-slate-800 shadow-md ring-1 ring-white dark:ring-slate-700 select-none"
                        title={reactionConfig.label}
                      >
                        {reactionConfig.emoji}
                      </span>
                    </div>

                    {/* User Info */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                          {user.name}
                        </span>
                        {user.isVerified && <VerifiedBadge size="sm" />}
                        {user.isFriend && (
                          <span
                            className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                            title="Bạn bè (cùng theo dõi nhau)"
                          >
                            <Users className="w-2.5 h-2.5" />
                            <span>Bạn bè</span>
                          </span>
                        )}
                        {user.role === "admin" && (
                          <span className="px-1.5 py-0.2 text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 rounded-md">
                            ADMIN
                          </span>
                        )}
                        {isSelf && (
                          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                            (Bạn)
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        @{user.username}
                      </p>
                      {user.bio && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1 mt-0.5 max-w-[280px]">
                          {user.bio}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action / Follow Button */}
                  {!isSelf && (
                    <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={(e) => handleToggleFollow(e, user.id)}
                        disabled={isActionLoading}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                          isFollowing
                            ? "bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-950/40 dark:text-slate-300 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700"
                            : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs active:scale-95"
                        }`}
                      >
                        {isActionLoading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : isFollowing ? (
                          <>
                            <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Đang theo dõi</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Theo dõi</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>Nhấn vào người dùng để xem trang cá nhân</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-medium transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
