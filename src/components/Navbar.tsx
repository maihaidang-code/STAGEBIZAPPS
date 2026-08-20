import React, { useState, useRef, useEffect } from "react";
import { 
  Search, 
  PlusCircle, 
  LogOut, 
  User as UserIcon, 
  Settings,
  Sparkles, 
  Users, 
  LogIn, 
  UserPlus,
  ChevronDown
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { User } from "../types";
import { VerifiedBadge } from "./VerifiedBadge";
import { SettingsModal } from "./SettingsModal";

interface NavbarProps {
  onOpenCreatePost: () => void;
  onSelectUser: (userId: string) => void;
  onSearch: (query: string) => void;
  searchQuery: string;
  onNavigateHome: () => void;
  onShowToast?: (text: string, type: "success" | "error" | "info") => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenCreatePost,
  onSelectUser,
  onSearch,
  searchQuery,
  onNavigateHome,
  onShowToast,
}) => {
  const { user, isAuthenticated, logout, openAuthModal, switchDemoAccount } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isDemoMenuOpen, setIsDemoMenuOpen] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [demoUsers, setDemoUsers] = useState<(User & { defaultPassword: string })[]>([]);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const demoMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch demo accounts for easy multi-user testing
    api.getDemoUsers().then(setDemoUsers).catch(() => {});
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (demoMenuRef.current && !demoMenuRef.current.contains(event.target as Node)) {
        setIsDemoMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 cursor-pointer select-none" onClick={onNavigateHome}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div className="hidden sm:block">
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-sky-600 bg-clip-text text-transparent">
              StageBiz
            </span>
            <span className="block text-[10px] font-medium text-slate-400 -mt-1 tracking-wider uppercase">
              Mini Social Network
            </span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-md mx-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="navbar-search-input"
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Tìm kiếm bài viết, #hashtag hoặc tên người dùng..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-100 dark:bg-slate-800 border-none rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 transition-all"
            />
          </div>
        </div>

        {/* Actions & User Section */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Demo Switcher */}
          <div className="relative" ref={demoMenuRef}>
            <button
              id="btn-demo-accounts-switcher"
              onClick={() => setIsDemoMenuOpen(!isDemoMenuOpen)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
              title="Chuyển nhanh tài khoản thử nghiệm"
            >
              <Users className="w-4 h-4 text-slate-500" />
              <span className="hidden lg:inline">Tài khoản mẫu</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isDemoMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-700/60">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Chuyển nhanh tài khoản demo
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">
                    Mật khẩu mặc định: <code className="bg-slate-100 dark:bg-slate-900 px-1 py-0.5 rounded">123456</code>
                  </p>
                </div>
                <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/40">
                  {demoUsers.map((demo) => (
                    <button
                      key={demo.id}
                      onClick={() => {
                        switchDemoAccount(demo);
                        setIsDemoMenuOpen(false);
                      }}
                      className={`w-full px-3 py-2.5 flex items-center gap-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                        user?.id === demo.id ? "bg-indigo-50/70 dark:bg-indigo-950/40" : ""
                      }`}
                    >
                      <img
                        src={demo.avatar}
                        alt={demo.name}
                        className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                              {demo.name}
                            </p>
                            {demo.isVerified && <VerifiedBadge size="xs" />}
                          </div>
                          {user?.id === demo.id && (
                            <span className="text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 px-1.5 py-0.2 rounded font-medium shrink-0">
                              Đang đăng nhập
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">@{demo.username}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {isAuthenticated && user ? (
            <>
              {/* Create Post Button */}
              <button
                id="btn-nav-create-post"
                onClick={onOpenCreatePost}
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Đăng bài</span>
              </button>

              {/* User Avatar & Dropdown */}
              <div className="relative" ref={userMenuRef}>
                <button
                  id="btn-user-avatar-menu"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-indigo-400 transition-all"
                >
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                  />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-50">
                    <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700">
                      <div className="flex items-center gap-1">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{user.name}</p>
                        {user.isVerified && <VerifiedBadge size="sm" />}
                      </div>
                      <p className="text-xs text-slate-400 truncate">@{user.username}</p>
                    </div>

                    <button
                      id="menu-item-profile"
                      onClick={() => {
                        onSelectUser(user.id);
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-2.5"
                    >
                      <UserIcon className="w-4 h-4 text-slate-500" />
                      <span>Trang cá nhân</span>
                    </button>

                    <button
                      id="menu-item-settings"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        setShowSettingsModal(true);
                      }}
                      className="w-full px-4 py-2 text-left text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-2.5"
                    >
                      <Settings className="w-4 h-4 text-slate-500" />
                      <span>Cài đặt & Bảo mật</span>
                    </button>

                    <div className="my-1 border-t border-slate-100 dark:border-slate-700/60" />

                    <button
                      id="menu-item-logout"
                      onClick={() => {
                        logout();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2.5"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                id="btn-nav-login"
                onClick={() => openAuthModal("login")}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                <LogIn className="w-4 h-4" />
                <span>Đăng nhập</span>
              </button>
              <button
                id="btn-nav-register"
                onClick={() => openAuthModal("register")}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                <span>Đăng ký</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Settings Modal (Change Password & Delete Account) */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onShowToast={onShowToast || (() => {})}
      />
    </header>
  );
};
