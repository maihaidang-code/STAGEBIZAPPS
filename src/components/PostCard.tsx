import React, { useState, useRef } from "react";
import { 
  MessageCircle, 
  Share2, 
  MoreHorizontal, 
  Edit3, 
  Trash2, 
  X, 
  Check, 
  Image as ImageIcon,
  Repeat,
  Sparkles,
  ExternalLink,
  Users,
  Upload,
  Plus,
  Images
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { Post, PostVisibility, ReactionType, ReactionSummary } from "../types";
import { formatTimeAgo } from "../utils/timeAgo";
import { CommentSection } from "./CommentSection";
import { VerifiedBadge } from "./VerifiedBadge";
import { PostReactionButton, ReactionSummaryBadge } from "./Reactions";
import { PostReactionsModal } from "./PostReactionsModal";
import { SharePostModal } from "./SharePostModal";
import { PrivacySelector, PostPrivacyBadge } from "./PrivacySelector";
import { resizeMultipleImagesTo300x300 } from "../utils/imageResize";

interface PostCardProps {
  post: Post;
  onPostUpdated: (updated: Post) => void;
  onPostDeleted: (postId: string) => void;
  onSelectUser: (userId: string) => void;
  onFilterHashtag: (tag: string) => void;
  onShowImageModal: (url: string, images?: string[], initialIndex?: number) => void;
  onShowToast: (text: string, type?: "success" | "error" | "info") => void;
  onPostCreated?: (newPost: Post) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onPostUpdated,
  onPostDeleted,
  onSelectUser,
  onFilterHashtag,
  onShowImageModal,
  onShowToast,
  onPostCreated,
}) => {
  const { user, isAuthenticated, openAuthModal } = useAuth();
  
  // Reactions state
  const [userReaction, setUserReaction] = useState<ReactionType | null>(
    post.userReaction || (user && post.likes.includes(user.id) ? "like" : null)
  );
  const [likesCount, setLikesCount] = useState(post.likes.length);
  const [reactionsSummary, setReactionsSummary] = useState<ReactionSummary | undefined>(post.reactionsSummary);

  const [sharesCount, setSharesCount] = useState(post.sharesCount || 0);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount || 0);
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Modals state
  const [showReactionsModal, setShowReactionsModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Post images normalized
  const postImages: string[] = post.images && post.images.length > 0
    ? post.images
    : post.image
      ? [post.image]
      : [];

  // Edit post state
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [editImages, setEditImages] = useState<string[]>(postImages);
  const [editImageUrlInput, setEditImageUrlInput] = useState("");
  const [editVisibility, setEditVisibility] = useState<PostVisibility>(post.visibility || "public");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isProcessingEditImages, setIsProcessingEditImages] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const isAuthor = user?.id === post.authorId;

  // Handle specific reaction (from floating picker)
  const handleSelectReaction = async (type: ReactionType) => {
    if (!isAuthenticated) {
      openAuthModal("login");
      return;
    }

    try {
      const res = await api.reactToPost(post.id, type);
      setUserReaction(res.userReaction);
      setLikesCount(res.likesCount);
      setReactionsSummary(res.reactionsSummary);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Thao tác bày tỏ cảm xúc thất bại";
      onShowToast(errorMsg, "error");
    }
  };

  // Handle quick click toggle on like button
  const handleQuickToggleLike = async () => {
    if (!isAuthenticated) {
      openAuthModal("login");
      return;
    }

    const nextType: ReactionType = userReaction ? userReaction : "like";
    try {
      const res = await api.reactToPost(post.id, nextType);
      setUserReaction(res.userReaction);
      setLikesCount(res.likesCount);
      setReactionsSummary(res.reactionsSummary);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Thao tác thích thất bại";
      onShowToast(errorMsg, "error");
    }
  };

  const handleOpenShareModal = () => {
    setShowShareModal(true);
  };

  const handlePostSharedSuccess = (newPost: Post, newSharesCount: number) => {
    setSharesCount(newSharesCount);
    if (newPost && newPost.id !== post.id && onPostCreated) {
      onPostCreated(newPost);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bài viết này không?")) return;
    try {
      await api.deletePost(post.id);
      onPostDeleted(post.id);
      onShowToast("Đã xóa bài viết thành công", "info");
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Xóa bài viết thất bại";
      onShowToast(errorMsg, "error");
    }
  };

  const handleStartEdit = () => {
    setEditContent(post.content);
    setEditImages(postImages);
    setEditVisibility(post.visibility || "public");
    setIsEditing(true);
    setShowMenu(false);
  };

  const handleEditFileUpload = async (files: FileList | File[] | null) => {
    if (!files || files.length === 0) return;
    const fileList = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (fileList.length === 0) return;

    if (editImages.length + fileList.length > 10) {
      onShowToast("Tối đa 10 ảnh trong 1 bài viết", "error");
      return;
    }

    setIsProcessingEditImages(true);
    try {
      const resized = await resizeMultipleImagesTo300x300(fileList);
      setEditImages((prev) => [...prev, ...resized]);
      onShowToast(`Đã thêm & tối ưu hóa ${resized.length} ảnh (300x300 px)`, "success");
    } catch {
      onShowToast("Lỗi xử lý ảnh", "error");
    } finally {
      setIsProcessingEditImages(false);
      if (editFileInputRef.current) editFileInputRef.current.value = "";
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editContent.trim() && editImages.length === 0) {
      onShowToast("Nội dung bài viết hoặc ảnh không được để trống", "error");
      return;
    }

    setIsSavingEdit(true);
    try {
      const updated = await api.updatePost(
        post.id,
        editContent.trim(),
        editImages,
        editVisibility
      );
      onPostUpdated(updated);
      setIsEditing(false);
      onShowToast("Đã cập nhật bài viết thành công!", "success");
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Cập nhật thất bại";
      onShowToast(errorMsg, "error");
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Helper to render text with clickable hashtags
  const renderFormattedContent = (text: string) => {
    const parts = text.split(/(\s+)/);
    return parts.map((part, index) => {
      if (part.startsWith("#") && part.length > 1) {
        return (
          <span
            key={index}
            onClick={(e) => {
              e.stopPropagation();
              onFilterHashtag(part);
            }}
            className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  // Helper to render responsive multi-image gallery grid
  const renderImageGalleryGrid = (imagesList: string[], isShared = false) => {
    if (!imagesList || imagesList.length === 0) return null;

    const count = imagesList.length;

    // Single image
    if (count === 1) {
      return (
        <div
          className={`rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 max-h-[420px] bg-slate-950/5 cursor-pointer group relative ${
            isShared ? "max-h-64" : ""
          }`}
          onClick={(e) => {
            e.stopPropagation();
            onShowImageModal(imagesList[0], imagesList, 0);
          }}
        >
          <img
            src={imagesList[0]}
            alt="Hình ảnh bài đăng"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover max-h-[420px] group-hover:scale-[1.01] transition-transform duration-300"
          />
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-white text-[10px] font-mono">
            300x300 px
          </div>
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <span className="bg-black/60 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-xs flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5" /> Phóng to
            </span>
          </div>
        </div>
      );
    }

    // 2 images: 2 equal columns
    if (count === 2) {
      return (
        <div className="grid grid-cols-2 gap-1.5 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
          {imagesList.map((img, idx) => (
            <div
              key={idx}
              className="relative aspect-square sm:aspect-4/3 cursor-pointer group bg-slate-900/5 overflow-hidden"
              onClick={(e) => {
                e.stopPropagation();
                onShowImageModal(img, imagesList, idx);
              }}
            >
              <img
                src={img}
                alt={`Ảnh ${idx + 1}`}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            </div>
          ))}
        </div>
      );
    }

    // 3 images: 1 large left, 2 stacked right
    if (count === 3) {
      return (
        <div className="grid grid-cols-3 gap-1.5 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 h-64 sm:h-80">
          <div
            className="col-span-2 relative cursor-pointer group bg-slate-900/5 overflow-hidden"
            onClick={(e) => {
              e.stopPropagation();
              onShowImageModal(imagesList[0], imagesList, 0);
            }}
          >
            <img
              src={imagesList[0]}
              alt="Ảnh 1"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
          </div>
          <div className="grid grid-rows-2 gap-1.5 h-full">
            {imagesList.slice(1, 3).map((img, idx) => (
              <div
                key={idx}
                className="relative cursor-pointer group bg-slate-900/5 overflow-hidden h-full"
                onClick={(e) => {
                  e.stopPropagation();
                  onShowImageModal(img, imagesList, idx + 1);
                }}
              >
                <img
                  src={img}
                  alt={`Ảnh ${idx + 2}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              </div>
            ))}
          </div>
        </div>
      );
    }

    // 4+ images: 2x2 grid, 4th item shows +N if count > 4
    const displayImages = imagesList.slice(0, 4);
    const remainingCount = count - 4;

    return (
      <div className="grid grid-cols-2 gap-1.5 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
        {displayImages.map((img, idx) => {
          const isLastAndMore = idx === 3 && remainingCount > 0;
          return (
            <div
              key={idx}
              className="relative aspect-square cursor-pointer group bg-slate-900/5 overflow-hidden"
              onClick={(e) => {
                e.stopPropagation();
                onShowImageModal(img, imagesList, idx);
              }}
            >
              <img
                src={img}
                alt={`Ảnh ${idx + 1}`}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />

              {isLastAndMore && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center text-white font-black text-xl sm:text-2xl">
                  +{remainingCount + 1}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const isRepost = Boolean(post.originalPostId);
  const originalPost = post.originalPost;
  const totalReactions = reactionsSummary?.total || likesCount;

  return (
    <div
      id={`post-${post.id}`}
      className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 p-4 sm:p-5 transition-shadow hover:shadow-sm"
    >
      {/* Repost Header notification if this is a share */}
      {isRepost && (
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium mb-3 pb-2.5 border-b border-slate-100 dark:border-slate-700/60">
          <Repeat className="w-3.5 h-3.5 text-indigo-500" />
          <span>
            <strong>{post.author.name}</strong> đã chia sẻ bài viết này
          </span>
        </div>
      )}

      {/* Post Main Content */}
      <div className="space-y-3.5">
        {/* Author Header */}
        <div className="flex items-start justify-between">
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => onSelectUser(post.author.id)}
          >
            <img
              src={post.author.avatar}
              alt={post.author.name}
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 group-hover:ring-2 group-hover:ring-indigo-500 transition-all"
            />
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {post.author.name}
                </span>
                {post.author.isVerified && <VerifiedBadge size="sm" />}
                {post.author.isFriend && (
                  <span
                    className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                    title="Bạn bè (cùng theo dõi nhau)"
                  >
                    <Users className="w-2.5 h-2.5" />
                    <span>Bạn bè</span>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span>@{post.author.username}</span>
                <span>•</span>
                <span>{formatTimeAgo(post.createdAt)}</span>
                <span>•</span>
                <PostPrivacyBadge visibility={post.visibility || "public"} size="sm" />
                {post.updatedAt && (
                  <>
                    <span>•</span>
                    <span className="italic text-[11px] text-slate-400">Đã sửa</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Context Options Menu (Author or Admin) */}
          {(isAuthor || user?.role === "admin") && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                title="Tùy chọn bài viết"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {showMenu && (
                <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-20 animate-in fade-in zoom-in-95 duration-100">
                  {isAuthor && (
                    <button
                      type="button"
                      onClick={handleStartEdit}
                      className="w-full px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Chỉnh sửa</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      handleDelete();
                    }}
                    className="w-full px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa bài viết</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Post Body (Edit Mode vs Read Mode) */}
        {isEditing ? (
          <form onSubmit={handleSaveEdit} className="space-y-3 pt-1">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={3}
              className="w-full p-3 bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-indigo-300 dark:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
              placeholder="Nội dung bài viết..."
            />

            {/* Edit Images List */}
            {editImages.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                  <Images className="w-3.5 h-3.5 text-indigo-500" />
                  Ảnh đính kèm ({editImages.length} ảnh - 300x300 px):
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {editImages.map((url, idx) => (
                    <div key={idx} className="relative rounded-lg overflow-hidden border border-slate-200 aspect-square group">
                      <img src={url} alt={`Edit img ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setEditImages((prev) => prev.filter((_, i) => i !== idx))}
                        className="absolute top-1 right-1 p-1 rounded-full bg-black/60 hover:bg-red-600 text-white transition-colors"
                        title="Xóa ảnh này"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add More Images in Edit Mode */}
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="file"
                ref={editFileInputRef}
                onChange={(e) => handleEditFileUpload(e.target.files)}
                accept="image/*"
                multiple
                className="hidden"
              />
              <button
                type="button"
                disabled={isProcessingEditImages}
                onClick={() => editFileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 hover:border-indigo-500 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
              >
                {isProcessingEditImages ? <Sparkles className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5 text-indigo-500" />}
                <span>Thêm ảnh từ máy (300x300)</span>
              </button>

              <div className="flex items-center gap-1 flex-1 min-w-[200px]">
                <input
                  type="url"
                  value={editImageUrlInput}
                  onChange={(e) => setEditImageUrlInput(e.target.value)}
                  placeholder="Hoặc dán URL ảnh..."
                  className="flex-1 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900/80 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (editImageUrlInput.trim()) {
                      setEditImages((prev) => [...prev, editImageUrlInput.trim()]);
                      setEditImageUrlInput("");
                    }
                  }}
                  className="px-2.5 py-1.5 text-xs bg-slate-200 dark:bg-slate-700 hover:bg-indigo-600 hover:text-white rounded-lg font-semibold"
                >
                  Thêm
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <PrivacySelector
                value={editVisibility}
                onChange={setEditVisibility}
                size="sm"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" /> Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit || isProcessingEditImages}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1 shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isSavingEdit ? "Đang lưu..." : "Lưu thay đổi"}</span>
                </button>
              </div>
            </div>
          </form>
        ) : (
          <>
            {post.content && (
              <p className="text-sm sm:text-base text-slate-800 dark:text-slate-100 leading-relaxed break-words whitespace-pre-line">
                {renderFormattedContent(post.content)}
              </p>
            )}

            {/* Direct Multi-Image Gallery */}
            {postImages.length > 0 && renderImageGalleryGrid(postImages, false)}

            {/* Embedded Shared Original Post Card */}
            {isRepost && originalPost && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50/60 dark:bg-slate-850/60 p-3.5 space-y-2.5 transition-colors hover:border-indigo-300 dark:hover:border-indigo-600/50">
                {/* Original Author Header */}
                <div
                  className="flex items-center gap-2.5 cursor-pointer group/orig"
                  onClick={() => onSelectUser(originalPost.authorId)}
                >
                  <img
                    src={originalPost.author.avatar}
                    alt={originalPost.author.name}
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 group-hover/orig:ring-1 group-hover/orig:ring-indigo-500"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900 dark:text-white group-hover/orig:text-indigo-600 dark:group-hover/orig:text-indigo-400 transition-colors">
                        {originalPost.author.name}
                      </span>
                      {originalPost.author.isVerified && <VerifiedBadge size="sm" />}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      <span>@{originalPost.author.username}</span>
                      <span className="mx-1">•</span>
                      <span>{formatTimeAgo(originalPost.createdAt)}</span>
                    </p>
                  </div>
                </div>

                {/* Original Post Content */}
                {originalPost.content && (
                  <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {renderFormattedContent(originalPost.content)}
                  </p>
                )}

                {/* Original Post Image Gallery */}
                {(originalPost.images?.length || originalPost.image) && (
                  <div>
                    {renderImageGalleryGrid(
                      originalPost.images && originalPost.images.length > 0
                        ? originalPost.images
                        : originalPost.image
                          ? [originalPost.image]
                          : [],
                      true
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Interaction Summary Counters (Top summary bar) */}
        {(totalReactions > 0 || commentsCount > 0 || sharesCount > 0) && (
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1 pt-1">
            <div>
              <ReactionSummaryBadge
                summary={reactionsSummary}
                total={totalReactions}
                onClick={() => setShowReactionsModal(true)}
                size="sm"
              />
            </div>

            <div className="flex items-center gap-3 text-[11px]">
              {commentsCount > 0 && (
                <button
                  type="button"
                  onClick={() => setShowComments(!showComments)}
                  className="hover:underline hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                >
                  {commentsCount} bình luận
                </button>
              )}
              {sharesCount > 0 && (
                <span>{sharesCount} lượt chia sẻ</span>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons Bar */}
        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-700/60 pt-2 text-slate-600 dark:text-slate-300">
          {/* Reaction Button with Facebook-like hover/hold menu */}
          <div className="flex-1 flex justify-center">
            <PostReactionButton
              userReaction={userReaction}
              onSelectReaction={handleSelectReaction}
              onQuickToggle={handleQuickToggleLike}
            />
          </div>

          {/* Comment Toggle Button */}
          <button
            type="button"
            id={`btn-comment-${post.id}`}
            onClick={() => setShowComments(!showComments)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              showComments
                ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400"
                : "hover:bg-slate-100 dark:hover:bg-slate-700/50"
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            <span>Bình luận</span>
          </button>

          {/* Share Button (Native / Profile Repost / Copy Link) */}
          <button
            type="button"
            id={`btn-share-${post.id}`}
            onClick={handleOpenShareModal}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>Chia sẻ</span>
          </button>
        </div>

        {/* Comment Section (Accordion Drawer) */}
        {showComments && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60">
            <CommentSection
              postId={post.id}
              onCommentCountChange={(newCount) => setCommentsCount(newCount)}
              onSelectUser={onSelectUser}
              onShowToast={onShowToast}
            />
          </div>
        )}
      </div>

      {/* Reactions Details Modal */}
      {showReactionsModal && (
        <PostReactionsModal
          postId={post.id}
          onClose={() => setShowReactionsModal(false)}
          onSelectUser={onSelectUser}
          onShowToast={onShowToast}
        />
      )}

      {/* Share Post Modal */}
      {showShareModal && (
        <SharePostModal
          post={post}
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          onShareSuccess={handlePostSharedSuccess}
          onShowToast={onShowToast}
        />
      )}
    </div>
  );
};
