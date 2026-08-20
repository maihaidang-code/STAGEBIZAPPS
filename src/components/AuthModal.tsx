import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Lock, Mail, User as UserIcon, Eye, EyeOff, Sparkles, LogIn, UserPlus } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { User } from "../types";
import { VerifiedBadge } from "./VerifiedBadge";

interface AuthModalProps {
  onShowToast: (text: string, type?: "success" | "error" | "info") => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onShowToast }) => {
  const { authModalState, closeAuthModal, login, register, switchDemoAccount } = useAuth();
  const [tab, setTab] = useState<"login" | "register">(authModalState.initialTab);

  // Form states
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Demo users list for 1-click test
  const [demoUsers, setDemoUsers] = useState<(User & { defaultPassword: string })[]>([]);

  useEffect(() => {
    setTab(authModalState.initialTab);
    setErrorMessage("");
  }, [authModalState.initialTab, authModalState.isOpen]);

  useEffect(() => {
    if (authModalState.isOpen) {
      api.getDemoUsers().then(setDemoUsers).catch(() => {});
    }
  }, [authModalState.isOpen]);

  if (!authModalState.isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    if (!identifier.trim() || !password) {
      setErrorMessage("Vui lòng nhập đầy đủ thông tin đăng nhập");
      return;
    }

    setIsSubmitting(true);
    try {
      await login(identifier.trim(), password);
      onShowToast("Đăng nhập thành công! Chào mừng bạn trở lại.", "success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Đăng nhập thất bại";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    if (!username.trim() || !email.trim() || !password || !name.trim()) {
      setErrorMessage("Vui lòng điền các trường bắt buộc (*)");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Mật khẩu phải có tối thiểu 6 ký tự");
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        username: username.trim(),
        email: email.trim(),
        password,
        name: name.trim(),
        bio: bio.trim(),
      });
      onShowToast("Đăng ký tài khoản thành công! Chào mừng bạn đến với StageBiz.", "success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Đăng ký thất bại";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div id="auth-modal-portal" className="fixed inset-0 z-[9999] overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity" 
        onClick={closeAuthModal}
        aria-hidden="true" 
      />

      {/* Centering container */}
      <div className="flex min-h-full items-center justify-center p-3 sm:p-4 text-center">
        <div
          className="relative transform overflow-hidden rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 text-left shadow-2xl border border-slate-200 dark:border-slate-800 transition-all w-full max-w-md my-auto flex flex-col max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3.5rem)] animate-in fade-in zoom-in-95 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">StageBiz</h3>
              <p className="text-[11px] text-slate-400">Mạng xã hội Mini với JWT &amp; Xác thực tick xanh</p>
            </div>
          </div>
          <button
            onClick={closeAuthModal}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switchers */}
        <div className="grid grid-cols-2 p-1.5 mx-6 bg-slate-100 dark:bg-slate-900 rounded-xl">
          <button
            id="tab-btn-login"
            onClick={() => {
              setTab("login");
              setErrorMessage("");
            }}
            className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              tab === "login"
                ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Đăng nhập</span>
          </button>

          <button
            id="tab-btn-register"
            onClick={() => {
              setTab("register");
              setErrorMessage("");
            }}
            className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              tab === "register"
                ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Đăng ký mới</span>
          </button>
        </div>

        {/* Error message banner */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-xs">
            {errorMessage}
          </div>
        )}

        {/* Form Body */}
        <div className="p-6">
          {tab === "login" ? (
            <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Email hoặc Tên đăng nhập
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    id="input-login-identifier"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="VD: haidang_dev hoặc email..."
                    required
                    className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Mật khẩu
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    id="input-login-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu..."
                    required
                    className="w-full pl-9 pr-9 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                id="btn-submit-login"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 mt-1"
              >
                {isSubmitting ? (
                  <Sparkles className="w-4 h-4 animate-spin" />
                ) : (
                  <LogIn className="w-4 h-4" />
                )}
                <span>{isSubmitting ? "Đang xác thực..." : "Đăng nhập ngay"}</span>
              </button>

              {/* Demo Accounts Quick Login Buttons */}
              <div className="mt-3 pt-4 border-t border-slate-100 dark:border-slate-700/60">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">
                  Hoặc đăng nhập nhanh bằng tài khoản demo:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {demoUsers.slice(0, 4).map((demo) => (
                    <button
                      key={demo.id}
                      type="button"
                      onClick={() => switchDemoAccount(demo)}
                      className="flex items-center gap-2 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:border-indigo-300 transition-colors text-left"
                    >
                      <img src={demo.avatar} alt={demo.name} className="w-7 h-7 rounded-full object-cover shrink-0" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 truncate">{demo.name}</p>
                          {demo.isVerified && <VerifiedBadge size="xs" />}
                        </div>
                        <p className="text-[9px] text-slate-400 truncate">@{demo.username}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Họ và tên <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  id="input-register-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VD: Nguyễn Văn An"
                  required
                  className="w-full px-3 py-1.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tên đăng nhập (Username) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  id="input-register-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="VD: vanan_dev"
                  required
                  className="w-full px-3 py-1.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Email <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    id="input-register-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    required
                    className="w-full pl-9 pr-3.5 py-1.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Mật khẩu (tối thiểu 6 ký tự) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    id="input-register-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Tạo mật khẩu an toàn..."
                    required
                    className="w-full pl-9 pr-9 py-1.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tiểu sử ngắn (Bio - tùy chọn)
                </label>
                <input
                  type="text"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Giới thiệu nhanh về bạn..."
                  className="w-full px-3 py-1.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
                />
              </div>

              <button
                type="submit"
                id="btn-submit-register"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 mt-2"
              >
                {isSubmitting ? (
                  <Sparkles className="w-4 h-4 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                <span>{isSubmitting ? "Đang tạo tài khoản..." : "Đăng ký tài khoản"}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  </div>,
  document.body
);
};
