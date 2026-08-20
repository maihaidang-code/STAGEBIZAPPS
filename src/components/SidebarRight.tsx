import React, { useState, useEffect } from "react";
import { UserPlus, UserCheck, TrendingUp, Sparkles, Hash, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { User } from "../types";
import { VerifiedBadge } from "./VerifiedBadge";

interface SidebarRightProps {
  onSelectUser: (userId: string) => void;
  onFilterHashtag: (tag: string) => void;
}

export const SidebarRight: React.FC<SidebarRightProps> = ({
  onSelectUser,
  onFilterHashtag,
}) => {
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const [suggestedUsers, setSuggestedUsers] = useState<(User & { followersCount: number; isFollowing: boolean })[]>([]);
  const [followingState, setFollowingState] = useState<Record<string, boolean>>({});
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    api.getSuggestedUsers().then((users) => {
      setSuggestedUsers(users);
      const state: Record<string, boolean> = {};
      users.forEach((u) => {
        state[u.id] = u.isFollowing;
      });
      setFollowingState(state);
    }).catch(() => {});
  }, [user]);

  const handleToggleFollow = async (targetUser: User) => {
    if (!isAuthenticated) {
      openAuthModal("login");
      return;
    }

    setLoadingMap((prev) => ({ ...prev, [targetUser.id]: true }));
    try {
      const res = await api.toggleFollow(targetUser.id);
      setFollowingState((prev) => ({ ...prev, [targetUser.id]: res.isFollowing }));
    } catch (err) {
      console.error("Follow error:", err);
    } finally {
      setLoadingMap((prev) => ({ ...prev, [targetUser.id]: false }));
    }
  };

  const trendingTags = [
    { tag: "ReactJS", posts: "1.2k bài viết" },
    { tag: "NodeJS", posts: "940 bài viết" },
    { tag: "Fullstack", posts: "820 bài viết" },
    { tag: "TechNews", posts: "650 bài viết" },
    { tag: "CuocSong", posts: "510 bài viết" },
  ];

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Suggested Follows Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Gợi ý theo dõi</h3>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {suggestedUsers.length === 0 ? (
            <p className="text-xs text-slate-400 py-2 text-center">Không có gợi ý mới lúc này</p>
          ) : (
            suggestedUsers.map((item) => {
              const isFollowed = followingState[item.id] ?? false;
              const isLoading = loadingMap[item.id] ?? false;

              return (
                <div key={item.id} className="flex items-center justify-between gap-2">
                  <div
                    className="flex items-center gap-2.5 min-w-0 cursor-pointer group"
                    onClick={() => onSelectUser(item.id)}
                  >
                    <img
                      src={item.avatar}
                      alt={item.name}
                      className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0 group-hover:scale-105 transition-transform"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-indigo-600 transition-colors">
                          {item.name}
                        </p>
                        {item.isVerified && <VerifiedBadge size="xs" />}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">@{item.username}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleFollow(item)}
                    disabled={isLoading}
                    className={`shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      isFollowed
                        ? "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-600"
                        : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs shadow-indigo-600/20"
                    }`}
                  >
                    {isFollowed ? (
                      <>
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Đã theo dõi</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Theo dõi</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Trending Topics / Hashtags */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-sky-500" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Chủ đề thịnh hành</h3>
        </div>

        <div className="flex flex-col gap-2.5">
          {trendingTags.map((item) => (
            <button
              key={item.tag}
              onClick={() => onFilterHashtag(`#${item.tag}`)}
              className="flex items-center justify-between text-left p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <Hash className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 transition-colors truncate">
                    #{item.tag}
                  </p>
                  <p className="text-[10px] text-slate-400">{item.posts}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Community Verification & Trust Badge */}
      <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-4 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2 mb-1.5 text-slate-800 dark:text-slate-200 font-bold">
          <ShieldCheck className="w-4 h-4 text-sky-500" />
          <span>Cộng đồng Xác minh Chính chủ</span>
        </div>
        <p className="leading-relaxed">
          Tài khoản có thể nộp hồ sơ xin cấp Tick Xanh qua trang cá nhân để được Quản trị viên xét duyệt.
        </p>
      </div>
    </div>
  );
};
