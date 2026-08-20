import React, { useState } from "react";
import { createPortal } from "react-dom";
import { X, Lock, KeyRound, AlertTriangle, Trash2, CheckCircle2, ShieldAlert } from "lucide-react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (text: string, type: "success" | "error" | "info") => void;
}

type TabType = "password" | "delete_account";

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("password");

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  // Delete account state
  const [deletePassword, setDeletePassword] = useState("");
  const [confirmDeleteText, setConfirmDeleteText] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  if (!isOpen || !user) return null;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Vui lòng điền đầy đủ tất cả các trường mật khẩu");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("Mật khẩu mới phải có độ dài ít nhất 6 ký tự");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Mật khẩu xác nhận không trùng khớp");
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError("Mật khẩu mới không được trùng với mật khẩu hiện tại");
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await api.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      onShowToast(res.message || "Đổi mật khẩu thành công!", "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Đổi mật khẩu thất bại";
      setPasswordError(msg);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError("");

    if (!deletePassword) {
      setDeleteError("Vui lòng nhập mật khẩu xác nhận của bạn");
      return;
    }

    if (confirmDeleteText !== user.username) {
      setDeleteError(`Vui lòng nhập chính xác tên đăng nhập "${user.username}" để xác nhận`);
      return;
    }

    setIsDeletingAccount(true);
    try {
      const res = await api.deleteAccount(deletePassword);
      onShowToast(res.message || "Tài khoản của bạn đã được xóa thành công", "info");
      logout();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Xóa tài khoản thất bại";
      setDeleteError(msg);
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return createPortal(
    <div id="settings-modal-portal" className="fixed inset-0 z-[9999] overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity" 
        onClick={onClose}
        aria-hidden="true" 
      />

      {/* Centering container */}
      <div className="flex min-h-full items-center justify-center p-3 sm:p-4 text-center">
        <div 
          className="relative transform overflow-hidden rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 text-left shadow-2xl border border-slate-200 dark:border-slate-800 transition-all w-full max-w-md my-auto flex flex-col max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3.5rem)] animate-in fade-in zoom-in-95 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                  Cài đặt tài khoản & Bảo mật
                </h3>
                <p className="text-xs text-slate-400">Quản lý mật khẩu và quyền riêng tư của @{user.username}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Selection */}
          <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-1.5 gap-1.5 shrink-0">
            <button
              onClick={() => {
                setActiveTab("password");
                setPasswordError("");
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "password"
                  ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Đổi mật khẩu</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("delete_account");
                setDeleteError("");
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "delete_account"
                  ? "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa tài khoản</span>
            </button>
          </div>

          {/* Body Content */}
          <div className="p-5 overflow-y-auto flex-1">
            {activeTab === "password" ? (
              <form onSubmit={handleChangePassword} className="space-y-4">
                {passwordError && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{passwordError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Mật khẩu hiện tại <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    id="input-current-password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Nhập mật khẩu hiện tại"
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Mật khẩu mới <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    id="input-new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Xác nhận mật khẩu mới <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    id="input-confirm-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới"
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                    required
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    id="btn-submit-change-password"
                    disabled={isChangingPassword}
                    className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isChangingPassword ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Đang cập nhật...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Cập nhật mật khẩu mới</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleDeleteAccount} className="space-y-4">
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-rose-700 dark:text-rose-300">
                    <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>CẢNH BÁO NGUY HIỂM: HÀNH ĐỘNG KHÔNG THỂ HOÀN TÁC!</span>
                  </div>
                  <p>
                    Khi xóa tài khoản, toàn bộ dữ liệu gồm thông tin cá nhân, các bài đăng, bình luận, và các quyền trong box chat của bạn sẽ bị gỡ bỏ vĩnh viễn khỏi hệ thống StageBiz.
                  </p>
                </div>

                {deleteError && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{deleteError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Nhập tên tài khoản <strong className="text-rose-600 dark:text-rose-400">"{user.username}"</strong> để xác nhận:
                  </label>
                  <input
                    type="text"
                    id="input-confirm-delete-username"
                    value={confirmDeleteText}
                    onChange={(e) => setConfirmDeleteText(e.target.value)}
                    placeholder={user.username}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500 transition-all font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Nhập mật khẩu hiện tại của bạn <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    id="input-delete-account-password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Mật khẩu của bạn"
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500 transition-all"
                    required
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    id="btn-submit-delete-account"
                    disabled={isDeletingAccount || confirmDeleteText !== user.username}
                    className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-sm font-bold shadow-md shadow-rose-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isDeletingAccount ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Đang xóa vĩnh viễn...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        <span>Xác nhận xóa tài khoản vĩnh viễn</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
