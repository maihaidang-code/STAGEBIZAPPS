import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Upload, Check, Sparkles, Image as ImageIcon, BadgeCheck } from "lucide-react";
import { User } from "../types";
import { api } from "../services/api";
import { VerifiedBadge } from "./VerifiedBadge";

interface EditProfileModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated: (updatedUser: User) => void;
  onShowToast: (text: string, type?: "success" | "error" | "info") => void;
}

const PRESET_AVATARS = [
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=400&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&auto=format&fit=crop&q=80",
];

const PRESET_COVERS = [
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&auto=format&fit=crop&q=80",
];

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  user,
  isOpen,
  onClose,
  onProfileUpdated,
  onShowToast,
}) => {
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio || "");
  const [location, setLocation] = useState(user.location || "");
  const [website, setWebsite] = useState(user.website || "");
  const [avatar, setAvatar] = useState(user.avatar);
  const [coverImage, setCoverImage] = useState(user.coverImage || "");
  const [isVerified, setIsVerified] = useState(Boolean(user.isVerified));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatar(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleCoverFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCoverImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      onShowToast("Tên hiển thị không được để trống", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await api.updateProfile({
        name: name.trim(),
        bio: bio.trim(),
        location: location.trim(),
        website: website.trim(),
        avatar,
        coverImage,
        isVerified,
      });

      onProfileUpdated(updated);
      onShowToast("Cập nhật thông tin cá nhân thành công!", "success");
      onClose();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Cập nhật thất bại";
      onShowToast(errorMsg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div id="edit-profile-modal-portal" className="fixed inset-0 z-[9999] overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity" 
        onClick={onClose}
        aria-hidden="true" 
      />

      {/* Centering container */}
      <div className="flex min-h-full items-center justify-center p-3 sm:p-4 text-center">
        <div
          className="relative transform overflow-hidden rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-800 text-left shadow-2xl border border-slate-200 dark:border-slate-700 transition-all w-full max-w-xl my-auto flex flex-col max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3.5rem)] animate-in fade-in zoom-in-95 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 shrink-0">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Chỉnh sửa trang cá nhân</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
          {/* Cover & Avatar Previews */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Ảnh bìa:</label>
            <div className="relative h-32 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 group">
              <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <input
                  type="file"
                  ref={coverInputRef}
                  onChange={handleCoverFile}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  className="px-3 py-1.5 bg-black/60 hover:bg-black/80 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" /> Thay ảnh bìa
                </button>
              </div>
            </div>

            {/* Preset Covers */}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[11px] text-slate-400">Mẫu sẵn:</span>
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {PRESET_COVERS.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCoverImage(url)}
                    className={`h-7 w-12 rounded overflow-hidden border shrink-0 ${
                      coverImage === url ? "ring-2 ring-indigo-500" : ""
                    }`}
                  >
                    <img src={url} alt="preset" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Avatar Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Ảnh đại diện:</label>
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-indigo-500 shrink-0 group">
                <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                <input
                  type="file"
                  ref={avatarInputRef}
                  onChange={handleAvatarFile}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Tải ảnh mới"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1">
                <p className="text-[11px] text-slate-400 mb-1.5">Chọn mẫu avatar hoặc tải ảnh từ máy:</p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {PRESET_AVATARS.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatar(url)}
                      className={`w-7 h-7 rounded-full overflow-hidden border ${
                        avatar === url ? "ring-2 ring-indigo-500 scale-110" : ""
                      }`}
                    >
                      <img src={url} alt="preset avatar" className="w-full h-full object-cover" />
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="px-2 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded text-[11px] font-medium"
                  >
                    Tải từ máy
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Tên hiển thị <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              id="edit-profile-name-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Tiểu sử (Bio)
            </label>
            <textarea
              id="edit-profile-bio-input"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="Giới thiệu đôi nét về bản thân bạn..."
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100 resize-none"
            />
          </div>

          {/* Location & Website */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Địa điểm
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="VD: Hà Nội, Việt Nam"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Trang web / Liên kết
              </label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://..."
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Verified Badge Setting */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-sky-100 dark:bg-sky-950/60 text-sky-600 flex items-center justify-center shrink-0">
                <BadgeCheck className="w-5 h-5 fill-sky-500 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Tick xanh xác minh StageBiz
                  </span>
                  {isVerified && <VerifiedBadge size="xs" />}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Hiển thị huy hiệu xác minh uy tín bên cạnh tên tài khoản
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                id="edit-profile-verified-toggle"
                checked={isVerified}
                onChange={(e) => setIsVerified(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-sky-500"></div>
            </label>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              id="btn-save-edit-profile"
              disabled={isSubmitting || !name.trim()}
              className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all"
            >
              {isSubmitting ? <Sparkles className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>{isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>,
  document.body
);
};
