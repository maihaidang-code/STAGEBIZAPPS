import React, { useState, useEffect } from "react";
import { 
  Home, 
  UserCheck, 
  User, 
  Compass, 
  Bell, 
  PlusCircle, 
  MessageSquare 
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

export type NavTab = "for-you" | "following" | "explore" | "chat" | "notifications" | "profile";

interface BottomTabBarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenCreatePost: () => void;
  onSelectUser: (userId: string) => void;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
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
      id: "explore" as NavTab,
      label: "Khám phá",
      icon: Compass,
    },
    {
      id: "following" as NavTab,
      label: "Đang theo dõi",
      icon: UserCheck,
      requiresAuth: true,
    },
    {
      id: "chat" as NavTab,
      label: "Box Chat",
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
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-2xl py-2 px-4 transition-colors">
      <div className="max-w-3xl mx-auto flex items-center justify-around sm:justify-evenly gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              id={`tabbar-btn-${item.id}`}
              onClick={() => {
                if (item.requiresAuth && !isAuthenticated) {
                  openAuthModal("login");
                  return;
                }
                onSelectTab(item.id);
              }}
              className={`relative p-3 rounded-2xl flex flex-col items-center justify-center transition-all ${
                isActive
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 scale-105"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
              title={item.label}
            >
              <div className="relative">
                <Icon className="w-6 h-6" />
                {Boolean(item.count && item.count > 0 && !isActive) && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900"></span>
                )}
              </div>
              {Boolean(item.count && item.count > 0) && (
                <span className="absolute 1 top-1 right-1 text-[9px] font-bold px-1.5 py-0.2 bg-rose-500 text-white rounded-full">
                  {item.count! > 99 ? "99+" : item.count}
                </span>
              )}
            </button>
          );
        })}

        {/* Create Post Icon Button */}
        <button
          id="tabbar-btn-create-post"
          onClick={onOpenCreatePost}
          className="p-3 rounded-2xl flex flex-col items-center justify-center bg-gradient-to-tr from-indigo-600 to-sky-500 text-white shadow-lg shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all"
          title="Đăng bài viết mới"
        >
          <PlusCircle className="w-6 h-6" />
        </button>

        {/* Profile Icon Button */}
        {isAuthenticated && user && (
          <button
            id="tabbar-btn-profile"
            onClick={() => {
              onSelectUser(user.id);
              onSelectTab("profile");
            }}
            className={`relative p-2.5 rounded-2xl flex items-center justify-center transition-all ${
              currentTab === "profile"
                ? "ring-2 ring-indigo-600 shadow-md shadow-indigo-600/30 scale-105 bg-indigo-50 dark:bg-indigo-950/50"
                : "hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
            title="Trang cá nhân của bạn"
          >
            <img
              src={user.avatar}
              alt={user.name}
              className="w-7 h-7 rounded-full object-cover border border-slate-200 dark:border-slate-700"
            />
          </button>
        )}
      </div>
    </nav>
  );
};
