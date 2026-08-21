import React, { useState, useEffect } from "react";
import { Plus, Sparkles, Eye, X, Image as ImageIcon, Send } from "lucide-react";
import { Story } from "../types";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { resizeMultipleImagesTo300x300 } from "../utils/imageResize";

interface StoriesBarProps {
  onShowToast: (message: string, type?: "success" | "error" | "info") => void;
  onOpenAuthModal: () => void;
}

const PRESET_STORY_IMAGES = [
  "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80",
];

export const StoriesBar: React.FC<StoriesBarProps> = ({ onShowToast, onOpenAuthModal }) => {
  const { user, isAuthenticated } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [mediaUrl, setMediaUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchStories = async () => {
    try {
      const data = await api.getStories();
      setStories(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStories();
  }, []);

  const handleCreateStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      onOpenAuthModal();
      return;
    }
    if (!mediaUrl) {
      onShowToast("Vui lòng chọn ảnh hoặc nhập URL ảnh cho tin", "error");
      return;
    }

    try {
      setIsSubmitting(true);
      await api.createStory({ mediaUrl, caption });
      onShowToast("Đăng tin (Story) thành công!", "success");
      setShowCreateModal(false);
      setMediaUrl("");
      setCaption("");
      fetchStories();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Đăng tin thất bại";
      onShowToast(msg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      const resized = await resizeMultipleImagesTo300x300(files);
      if (resized.length > 0) {
        setMediaUrl(resized[0]);
        onShowToast("Đã tải lên và tối ưu hóa ảnh tin (300x300 px)", "success");
      }
    } catch {
      onShowToast("Xử lý ảnh thất bại", "error");
    }
  };

  return (
    <div className="w-full bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/80 shadow-xs mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Khoảnh khắc (Stories)</h3>
        </div>
        <span className="text-[11px] text-slate-400 font-medium">Biến động 24h</span>
      </div>

      <div className="flex items-center gap-3 overflow-x-auto pb-1 no-scrollbar">
        {/* Create Story Button */}
        <div
          onClick={() => {
            if (!isAuthenticated) {
              onOpenAuthModal();
              return;
            }
            setShowCreateModal(true);
          }}
          className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group"
        >
          <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-indigo-400 dark:border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform relative overflow-hidden shadow-xs">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt="Avatar"
                className="w-full h-full object-cover opacity-50 absolute inset-0"
              />
            ) : null}
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md relative z-10">
              <Plus className="w-5 h-5" />
            </div>
          </div>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 max-w-[70px] truncate">
            Tạo tin
          </span>
        </div>

        {/* Stories List */}
        {stories.map((story) => (
          <div
            key={story.id}
            onClick={() => setActiveStory(story)}
            className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group"
          >
            <div className="w-16 h-16 rounded-2xl p-0.5 bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 group-hover:scale-105 transition-transform shadow-md">
              <div className="w-full h-full rounded-[14px] overflow-hidden bg-slate-900 border-2 border-white dark:border-slate-800">
                <img
                  src={story.mediaUrl}
                  alt={story.user.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 max-w-[70px] truncate">
              {story.user.name.split(" ")[0]}
            </span>
          </div>
        ))}
      </div>

      {/* Active Story Viewer Modal */}
      {activeStory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm h-[580px] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-700 flex flex-col justify-between">
            {/* Top progress bar / author info */}
            <div className="absolute top-0 inset-x-0 p-4 bg-gradient-to-b from-black/80 to-transparent z-20 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img
                  src={activeStory.user.avatar}
                  alt={activeStory.user.name}
                  referrerPolicy="no-referrer"
                  className="w-9 h-9 rounded-full object-cover border border-white/40"
                />
                <div>
                  <h4 className="text-xs font-bold text-white">{activeStory.user.name}</h4>
                  <p className="text-[10px] text-slate-300">@{activeStory.user.username}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveStory(null)}
                className="w-8 h-8 rounded-full bg-black/40 text-white hover:bg-black/70 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Story Media */}
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black">
              <img
                src={activeStory.mediaUrl}
                alt="Story"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />
            </div>

            {/* Bottom Caption & Stats */}
            <div className="absolute bottom-0 inset-x-0 p-5 z-20 flex flex-col gap-3">
              {activeStory.caption && (
                <p className="text-sm font-medium text-white drop-shadow-md text-center bg-black/40 backdrop-blur-xs p-3 rounded-xl border border-white/10">
                  {activeStory.caption}
                </p>
              )}
              <div className="flex items-center justify-between text-xs text-slate-300 pt-2 border-t border-white/10">
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4 text-indigo-400" />
                  <span>{activeStory.viewsCount} lượt xem</span>
                </span>
                <span>{new Date(activeStory.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Story Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <span>Đăng khoảnh khắc (Story)</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateStory} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Chọn ảnh cho tin (Story) <span className="text-rose-500">*</span>
                </label>

                {/* Preset quick images */}
                <div className="grid grid-cols-5 gap-2 mb-3">
                  {PRESET_STORY_IMAGES.map((url, idx) => (
                    <div
                      key={idx}
                      onClick={() => setMediaUrl(url)}
                      className={`h-16 rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                        mediaUrl === url ? "border-indigo-600 ring-2 ring-indigo-500/30 scale-105" : "border-slate-200 dark:border-slate-700 opacity-80 hover:opacity-100"
                      }`}
                    >
                      <img src={url} alt={`Preset ${idx}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    placeholder="Hoặc dán URL ảnh trực tiếp..."
                    className="flex-1 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                  <label className="px-4 py-2.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 shrink-0 border border-indigo-200 dark:border-indigo-800">
                    <ImageIcon className="w-4 h-4" />
                    <span>Tải lên</span>
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
              </div>

              {mediaUrl && (
                <div className="w-full h-36 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 relative bg-slate-900">
                  <img src={mediaUrl} alt="Preview" className="w-full h-full object-cover" />
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-bold">
                    Xem trước ảnh tin
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Lời nhắn / Chú thích (Caption)
                </label>
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Ví dụ: Ngày mới năng suất cùng team! ✨"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !mediaUrl}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/30 disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  {isSubmitting ? "Đang đăng..." : "Đăng tin ngay"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
