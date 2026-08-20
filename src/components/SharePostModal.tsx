import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Share2,
  Copy,
  Check,
  Send,
  Loader2,
  Repeat,
  Sparkles,
  Globe,
  Lock,
  Image as ImageIcon
} from "lucide-react";
import { Post, PostVisibility } from "../types";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { VerifiedBadge } from "./VerifiedBadge";
import { PrivacySelector } from "./PrivacySelector";

interface SharePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post;
  onPostShared: (newPost: Post, newSharesCount: number) => void;
  onShowToast: (text: string, type?: "success" | "error" | "info") => void;
  onSelectUser?: (userId: string) => void;
}

export const SharePostModal: React.FC<SharePostModalProps> = ({
  isOpen,
  onClose,
  post,
  onPostShared,
  onShowToast,
  onSelectUser,
}) => {
  const { user: currentUser, isAuthenticated, openAuthModal } = useAuth();
  const [caption, setCaption] = useState("");
  const [visibility, setVisibility] = useState<PostVisibility>("public");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCaption("");
      setVisibility("public");
      setIsSubmitting(false);
      setIsCopied(false);
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !post) return null;

  // The actual source content is either the original post (if this post was already a repost) or this post
  const displayPost = post.originalPost || post;

  const handleShareToProfile = async () => {
    if (!isAuthenticated) {
      openAuthModal("login");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.sharePostToProfile(post.id, caption.trim() || undefined, visibility);
      onPostShared(res.newPost, res.sharesCount);
      onShowToast("Đã chia sẻ bài viết về trang cá nhân của bạn!", "success");
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Chia sẻ bài viết thất bại";
      onShowToast(msg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      const url = `${window.location.origin}/?post=${post.id}`;
      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      onShowToast("Đã sao chép liên kết bài viết vào bộ nhớ tạm!", "info");
      setTimeout(() => setIsCopied(false), 2500);

      // Track quick share count
      try {
        const res = await api.sharePost(post.id);
        onPostShared(post, res.sharesCount);
      } catch {
        // silent
      }
    } catch {
      onShowToast("Không thể sao chép liên kết", "error");
    }
  };

  return createPortal(
    <div
      id="share-post-modal-backdrop"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="share-post-modal-container"
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Chia sẻ bài viết
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Chia sẻ ngay lên trang cá nhân hoặc sao chép liên kết
              </p>
            </div>
          </div>
          <button
            id="close-share-modal-btn"
            onClick={onClose}
            aria-label="Đóng"
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Current User Info (Sharing as) */}
          {isAuthenticated && currentUser ? (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100 dark:ring-slate-800"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {currentUser.name}
                    </span>
                    {currentUser.isVerified && <VerifiedBadge size="sm" />}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Chia sẻ về trang cá nhân
                  </p>
                </div>
              </div>

              {/* Privacy Selector */}
              <PrivacySelector
                value={visibility}
                onChange={setVisibility}
                size="sm"
              />
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/80 text-amber-800 dark:text-amber-200 text-xs flex items-center justify-between">
              <span>Bạn cần đăng nhập để chia sẻ lên trang cá nhân</span>
              <button
                type="button"
                onClick={() => openAuthModal("login")}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold"
              >
                Đăng nhập
              </button>
            </div>
          )}

          {/* Caption Textarea */}
          <div>
            <textarea
              id="share-post-caption-input"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Bạn nghĩ gì về bài viết này? (Thêm suy nghĩ của bạn...)"
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 resize-none transition-all"
            />
          </div>

          {/* Embedded Original Post Preview Card */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50/50 dark:bg-slate-800/40 p-3.5 space-y-2.5 overflow-hidden">
            {/* Author */}
            <div className="flex items-center gap-2.5">
              <img
                src={displayPost.author.avatar}
                alt={displayPost.author.name}
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {displayPost.author.name}
                  </span>
                  {displayPost.author.isVerified && <VerifiedBadge size="sm" />}
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate block">
                  @{displayPost.author.username}
                </span>
              </div>
            </div>

            {/* Post Content */}
            <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-3 leading-relaxed whitespace-pre-wrap">
              {displayPost.content}
            </p>

            {/* Image Preview (if present) */}
            {displayPost.image && (
              <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 max-h-48">
                <img
                  src={displayPost.image}
                  alt="Post preview"
                  referrerPolicy="no-referrer"
                  className="w-full h-36 object-cover"
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0">
          {/* Quick Copy Link */}
          <button
            type="button"
            id="share-modal-copy-link-btn"
            onClick={handleCopyLink}
            className={`w-full sm:w-auto px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border ${
              isCopied
                ? "bg-emerald-50 text-emerald-600 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"
                : "bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700"
            }`}
          >
            {isCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>Đã sao chép liên kết!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Sao chép liên kết</span>
              </>
            )}
          </button>

          {/* Submit Share Button */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
            >
              Hủy
            </button>
            <button
              type="button"
              id="confirm-share-to-profile-btn"
              onClick={handleShareToProfile}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-5 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 flex items-center justify-center gap-1.5 transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang chia sẻ...</span>
                </>
              ) : (
                <>
                  <Repeat className="w-3.5 h-3.5" />
                  <span>Chia sẻ lên Trang cá nhân</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
