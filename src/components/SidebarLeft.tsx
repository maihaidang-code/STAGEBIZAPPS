import React, { useState, useEffect } from "react";
import { 
  Home, 
  UserCheck, 
  User, 
  Compass, 
  Bell, 
  PlusCircle,
  LogIn,
  MessageSquare
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { VerifiedBadge } from "./VerifiedBadge";

export type NavTab = "for-you" | "following" | "explore" | "chat" | "notifications" | "profile";

interface SidebarLeftProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenCreatePost: () => void;
  onSelectUser: (userId: string) => void;
}

export const SidebarLeft: React.FC<SidebarLeftProps> = ({
  currentTab,
  onSelectTab,
  onOpenCreatePost,
  onSelectUser,
}) => {
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }

    const checkUnread = () => {
      api.getNotifications({ unreadOnly: true })
        .then((res) => setUnreadCount(res.unreadCount))
        .catch(() => {});
    };

    checkUnread();
    const interval = setInterval(checkUnread, 12000);
    return () => clearInterval(interval);
  }, [isAuthenticated, currentTab]);

  const navItems = [
    {
      id: "for-you" as NavTab,
      label: "Bảng tin chung",
      icon: Home,
    },
    {
      id: "chat" as NavTab,
      label: "Box Chat & Nhóm",
      icon: MessageSquare,
      badge: "Mới",
    },
    {
      id: "notifications" as NavTab,
      label: "Thông báo",
      icon: Bell,
      requiresAuth: true,
      count: unreadCount,
    },
    {
      id: "following" as NavTab,
      label: "Đang theo dõi",
      icon: UserCheck,
      requiresAuth: true,
    },
    {
      id: "explore" as NavTab,
      label: "Khám phá",
      icon: Compass,
    },
  ];

  return (
    <aside className="w-full flex flex-col gap-4">
      {/* Navigation Menu */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-3 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                id={`sidebar-nav-${item.id}`}
                onClick={() => {
                  if (item.requiresAuth && !isAuthenticated) {
                    openAuthModal("login");
                    return;
                  }
                  onSelectTab(item.id);
                }}
                className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60"
                }`}
              >
                <div className="relative shrink-0">
                  <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-slate-500 dark:text-slate-400"}`} />
                  {Boolean(item.count && item.count > 0 && !isActive) && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-800"></span>
                  )}
                </div>
                <span className="flex-1 text-left">{item.label}</span>
                {Boolean(item.count && item.count > 0) && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isActive ? "bg-white text-indigo-700 font-extrabold" : "bg-rose-500 text-white"
                  }`}>
                    {item.count! > 99 ? "99+" : item.count}
                  </span>
                )}
                {item.badge && !item.count && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                    isActive ? "bg-white/20 text-white" : "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {isAuthenticated && user && (
            <button
              id="sidebar-nav-profile"
              onClick={() => {
                onSelectUser(user.id);
                onSelectTab("profile");
              }}
              className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                currentTab === "profile"
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60"
              }`}
            >
              <User className={`w-5 h-5 shrink-0 ${currentTab === "profile" ? "text-white" : "text-slate-500 dark:text-slate-400"}`} />
              <span>Trang cá nhân</span>
            </button>
          )}
        </nav>

        {/* Create Post Action Button */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60">
          {isAuthenticated ? (
            <button
              id="sidebar-btn-create-post"
              onClick={onOpenCreatePost}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-white text-sm font-semibold shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Đăng bài mới</span>
            </button>
          ) : (
            <button
              id="sidebar-btn-login-prompt"
              onClick={() => openAuthModal("login")}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-sm font-medium transition-colors"
            >
              <LogIn className="w-4 h-4" />
              <span>Đăng nhập để tương tác</span>
            </button>
          )}
        </div>
      </div>

      {/* Mini Profile Card (if authenticated) */}
      {isAuthenticated && user && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => {
              onSelectUser(user.id);
              onSelectTab("profile");
            }}
          >
            <img
              src={user.avatar}
              alt={user.name}
              className="w-11 h-11 rounded-full object-cover border-2 border-indigo-100 dark:border-indigo-900 group-hover:scale-105 transition-transform"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-indigo-600 transition-colors">
                  {user.name}
                </h4>
                {user.isVerified && <VerifiedBadge size="xs" />}
              </div>
              <p className="text-xs text-slate-400 truncate">@{user.username}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/60 text-center">
            <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-700/40">
              <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                {user.followers?.length || 0}
              </span>
              <span className="text-[11px] text-slate-400">Người theo dõi</span>
            </div>
            <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-700/40">
              <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                {user.following?.length || 0}
              </span>
              <span className="text-[11px] text-slate-400">Đang theo dõi</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
