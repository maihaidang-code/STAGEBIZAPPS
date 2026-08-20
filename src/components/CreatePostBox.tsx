import React, { useState, useRef } from "react";
import { Image as ImageIcon, Sparkles, X, Upload, Link as LinkIcon, Send, Smile, Plus, Images } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { Post, PostVisibility } from "../types";
import { PrivacySelector } from "./PrivacySelector";
import { resizeMultipleImagesTo300x300 } from "../utils/imageResize";

interface CreatePostBoxProps {
  onPostCreated: (newPost: Post) => void;
  onShowToast: (text: string, type?: "success" | "error" | "info") => void;
}

const PRESET_IMAGES = [
  { label: "Lập trình", url: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1000&auto=format&fit=crop&q=80" },
  { label: "Cà phê & Setup", url: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1000&auto=format&fit=crop&q=80" },
  { label: "Biển & Hoàng hôn", url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000&auto=format&fit=crop&q=80" },
  { label: "Phố cổ", url: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1000&auto=format&fit=crop&q=80" },
  { label: "Núi tuyết", url: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1000&auto=format&fit=crop&q=80" },
];

const EMOJIS = ["🔥", "🚀", "☕️", "✨", "🎉", "💡", "❤️", "🙌", "🌅"];

export const CreatePostBox: React.FC<CreatePostBoxProps> = ({ onPostCreated, onShowToast }) => {
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const [content, setContent] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<PostVisibility>("public");
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingImages, setIsProcessingImages] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      openAuthModal("login");
      return;
    }

    if (!content.trim() && imageUrls.length === 0) {
      onShowToast("Vui lòng nhập nội dung bài viết hoặc đính kèm ảnh", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const newPost = await api.createPost(
        content.trim(),
        imageUrls.length > 0 ? imageUrls : undefined,
        visibility
      );
      setContent("");
      setImageUrls([]);
      setShowImagePicker(false);
      setShowEmojiPicker(false);
      onPostCreated(newPost);
      onShowToast("Đã đăng bài viết mới thành công!", "success");
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Đăng bài thất bại";
      onShowToast(errorMsg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = async (files: FileList | File[] | null) => {
    if (!files || files.length === 0) return;

    const fileList = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (fileList.length === 0) {
      onShowToast("Vui lòng chọn định dạng ảnh hợp lệ", "error");
      return;
    }

    // Limit maximum images per post if needed, e.g. 10
    if (imageUrls.length + fileList.length > 10) {
      onShowToast("Tối đa được đính kèm 10 ảnh trong 1 bài viết", "error");
      return;
    }

    setIsProcessingImages(true);
    try {
      // Automatically resize all uploaded images to 300x300 px
      const resizedImages = await resizeMultipleImagesTo300x300(fileList);
      setImageUrls((prev) => [...prev, ...resizedImages]);
      setShowImagePicker(false);
      onShowToast(
        `Đã tải lên & tự động tối ưu hóa ${resizedImages.length} ảnh (300x300 px)`,
        "success"
      );
    } catch (err) {
      console.error(err);
      onShowToast("Có lỗi khi xử lý hình ảnh", "error");
    } finally {
      setIsProcessingImages(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImageUrls((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleAddEmoji = (emoji: string) => {
    setContent((prev) => prev + emoji);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 border transition-all shadow-xs ${
        isDragging
          ? "border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/20 dark:bg-indigo-950/20"
          : "border-slate-200/80 dark:border-slate-700/80"
      }`}
    >
      <div className="flex gap-3.5 items-start">
        <img
          src={
            user?.avatar ||
            "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80"
          }
          alt={user?.name || "Khách"}
          className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
        />

        <div className="flex-1 min-w-0">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <textarea
              id="create-post-textarea"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                isAuthenticated
                  ? `${user?.name || "Bạn"} ơi, bạn đang nghĩ gì thế? Chia sẻ ngay...`
                  : "Đăng nhập để chia sẻ bài viết, nhiều hình ảnh và kết nối bạn bè..."
              }
              rows={3}
              className="w-full text-sm sm:text-base bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 resize-none transition-all"
            />

            {/* Attached Multi-Images Preview Grid */}
            {imageUrls.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Images className="w-3.5 h-3.5 text-indigo-500" />
                    Đã đính kèm {imageUrls.length} ảnh (giảm độ phân giải 300x300 px):
                  </span>
                  <button
                    type="button"
                    onClick={() => setImageUrls([])}
                    className="text-[11px] text-red-500 hover:text-red-600 font-semibold"
                  >
                    Xóa tất cả
                  </button>
                </div>

                <div className={`grid gap-2 ${
                  imageUrls.length === 1
                    ? "grid-cols-1 max-w-sm"
                    : imageUrls.length === 2
                    ? "grid-cols-2"
                    : "grid-cols-3 sm:grid-cols-4"
                }`}>
                  {imageUrls.map((url, idx) => (
                    <div
                      key={idx}
                      className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 aspect-square group bg-slate-100 dark:bg-slate-900"
                    >
                      <img
                        src={url}
                        alt={`Ảnh đính kèm ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 backdrop-blur-xs text-white text-[9px] font-medium rounded-md pointer-events-none">
                        300x300
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/65 hover:bg-red-600 text-white transition-colors cursor-pointer"
                        title="Xóa ảnh này"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  {/* Add more button tile if less than 10 */}
                  {imageUrls.length < 10 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-indigo-500 text-slate-400 hover:text-indigo-600 aspect-square transition-colors bg-slate-50 dark:bg-slate-800/50"
                      title="Thêm ảnh khác"
                    >
                      <Plus className="w-5 h-5" />
                      <span className="text-[10px] font-bold">Thêm ảnh</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Image Picker Panel */}
            {showImagePicker && (
              <div className="p-3 bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Tải lên nhiều ảnh (Tự động nén về 300x300 px):
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowImagePicker(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Upload multiple from file */}
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => handleFileUpload(e.target.files)}
                    accept="image/*"
                    multiple
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={isProcessingImages}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 bg-white dark:bg-slate-800 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 hover:border-indigo-500 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors shadow-2xs cursor-pointer"
                  >
                    {isProcessingImages ? (
                      <Sparkles className="w-4 h-4 text-indigo-500 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 text-indigo-500" />
                    )}
                    <span>
                      {isProcessingImages
                        ? "Đang nén ảnh về 300x300 px..."
                        : "Chọn nhiều ảnh từ máy tính (JPG, PNG, WebP)"}
                    </span>
                  </button>
                </div>

                {/* Direct URL input */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <LinkIcon className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="url"
                      value={customUrlInput}
                      onChange={(e) => setCustomUrlInput(e.target.value)}
                      placeholder="Hoặc dán đường dẫn ảnh (URL)..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (customUrlInput.trim()) {
                        setImageUrls((prev) => [...prev, customUrlInput.trim()]);
                        setCustomUrlInput("");
                        onShowToast("Đã thêm liên kết ảnh", "info");
                      }
                    }}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold"
                  >
                    Thêm
                  </button>
                </div>

                {/* Preset image suggestions */}
                <div>
                  <p className="text-[11px] text-slate-400 mb-1.5">Ảnh mẫu đẹp có thể chọn nhanh:</p>
                  <div className="grid grid-cols-5 gap-1.5">
                    {PRESET_IMAGES.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setImageUrls((prev) => [...prev, preset.url]);
                          onShowToast(`Đã thêm ảnh "${preset.label}"`, "info");
                        }}
                        className="group relative rounded-lg overflow-hidden h-14 border border-slate-200 hover:border-indigo-500 transition-all"
                      >
                        <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                        <span className="absolute inset-0 bg-black/40 text-[9px] font-medium text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          + {preset.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Emoji Quick Bar */}
            {showEmojiPicker && (
              <div className="p-2 bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 flex-wrap">
                {EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleAddEmoji(emoji)}
                    className="w-8 h-8 flex items-center justify-center text-base hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-transform hover:scale-125 cursor-pointer"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {/* Actions Bar */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  id="btn-post-photo-toggle"
                  onClick={() => setShowImagePicker(!showImagePicker)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    showImagePicker || imageUrls.length > 0
                      ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50"
                  }`}
                >
                  <ImageIcon className="w-4 h-4 text-emerald-500" />
                  <span>
                    {imageUrls.length > 0 ? `Ảnh (${imageUrls.length})` : "Nhiều ảnh (300px)"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    showEmojiPicker
                      ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50"
                  }`}
                >
                  <Smile className="w-4 h-4 text-amber-500" />
                  <span>Biểu cảm</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {isAuthenticated && (
                  <PrivacySelector
                    value={visibility}
                    onChange={setVisibility}
                    size="sm"
                  />
                )}

                <button
                  type="submit"
                  id="btn-submit-create-post"
                  disabled={isSubmitting || isProcessingImages || (!content.trim() && imageUrls.length === 0)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-sm shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  {isSubmitting ? (
                    <Sparkles className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>{isSubmitting ? "Đang đăng..." : "Đăng bài"}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
