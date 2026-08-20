import React, { useState, useEffect, useRef } from "react";
import { Send, Trash2, CornerDownRight, X, MessageSquare, ChevronDown, ChevronUp, User as UserIcon } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { Comment, ReactionType } from "../types";
import { formatTimeAgo } from "../utils/timeAgo";
import { VerifiedBadge } from "./VerifiedBadge";
import { CommentReactionButton, ReactionSummaryBadge } from "./Reactions";

interface CommentSectionProps {
  postId: string;
  postAuthorId: string;
  onCommentsCountChange: (newCount: number) => void;
  onSelectUser: (userId: string) => void;
  onShowToast: (text: string, type?: "success" | "error" | "info") => void;
}

interface ReplyTarget {
  parentCommentId: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
}

export const CommentSection: React.FC<CommentSectionProps> = ({
  postId,
  postAuthorId,
  onCommentsCountChange,
  onSelectUser,
  onShowToast,
}) => {
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentText, setNewCommentText] = useState("");
  const [replyTarget, setReplyTarget] = useState<ReplyTarget | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const calculateTotalComments = (items: Comment[]): number => {
    return items.reduce((sum, c) => sum + 1 + (c.replies?.length || 0), 0);
  };

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    api.getComments(postId)
      .then((data) => {
        if (isMounted) {
          setComments(data);
          const total = calculateTotalComments(data);
          onCommentsCountChange(total);

          // Auto-expand parents that have replies
          const initialExpanded: Record<string, boolean> = {};
          data.forEach((c) => {
            if (c.replies && c.replies.length > 0) {
              initialExpanded[c.id] = true;
            }
          });
          setExpandedReplies(initialExpanded);
        }
      })
      .catch((err) => console.error("Error loading comments:", err))
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [postId, onCommentsCountChange]);

  const toggleRepliesVisibility = (commentId: string) => {
    setExpandedReplies((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  const handleStartReply = (parentCommentId: string, authorId: string, authorName: string, authorUsername: string) => {
    if (!isAuthenticated) {
      openAuthModal("login");
      return;
    }

    setReplyTarget({
      parentCommentId,
      authorId,
      authorName,
      authorUsername,
    });

    // Automatically expand replies for this parent
    setExpandedReplies((prev) => ({ ...prev, [parentCommentId]: true }));

    // Focus input and add mention tag if replying to a sub-reply
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 50);
  };

  const handleCancelReply = () => {
    setReplyTarget(null);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      openAuthModal("login");
      return;
    }

    if (!newCommentText.trim()) return;

    setIsSubmitting(true);
    try {
      const parentId = replyTarget ? replyTarget.parentCommentId : undefined;
      const replyToUserId = replyTarget ? replyTarget.authorId : undefined;

      const added = await api.addComment(postId, newCommentText.trim(), parentId, replyToUserId);

      let updated: Comment[];
      if (parentId) {
        // Nested reply added
        updated = comments.map((c) => {
          if (c.id === parentId) {
            const replies = c.replies || [];
            return {
              ...c,
              replies: [...replies, added],
            };
          }
          return c;
        });
        setExpandedReplies((prev) => ({ ...prev, [parentId]: true }));
        onShowToast("Đã gửi câu trả lời!", "success");
      } else {
        // Top-level comment added
        updated = [...comments, added];
        onShowToast("Đã gửi bình luận!", "success");
      }

      setComments(updated);
      onCommentsCountChange(calculateTotalComments(updated));
      setNewCommentText("");
      setReplyTarget(null);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Gửi bình luận thất bại";
      onShowToast(errorMsg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string, parentCommentId?: string) => {
    try {
      await api.deleteComment(postId, commentId);
      let updated: Comment[];

      if (parentCommentId) {
        // Delete a reply
        updated = comments.map((c) => {
          if (c.id === parentCommentId) {
            return {
              ...c,
              replies: (c.replies || []).filter((r) => r.id !== commentId),
            };
          }
          return c;
        });
      } else {
        // Delete top-level comment
        updated = comments.filter((c) => c.id !== commentId);
      }

      setComments(updated);
      onCommentsCountChange(calculateTotalComments(updated));
      onShowToast("Đã xóa bình luận", "info");
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Xóa bình luận thất bại";
      onShowToast(errorMsg, "error");
    }
  };

  const handleReactToComment = async (commentId: string, parentCommentId?: string, reactionType: ReactionType = "like") => {
    if (!isAuthenticated) {
      openAuthModal("login");
      return;
    }

    try {
      const res = await api.reactToComment(postId, commentId, reactionType);
      
      const updateSingleComment = (c: Comment): Comment => {
        if (c.id === commentId) {
          return {
            ...c,
            userReaction: res.userReaction,
            reactionsSummary: res.reactionsSummary,
          };
        }
        return c;
      };

      setComments((prev) =>
        prev.map((c) => {
          if (c.id === commentId) {
            return updateSingleComment(c);
          }
          if (c.replies && c.replies.length > 0) {
            return {
              ...c,
              replies: c.replies.map(updateSingleComment),
            };
          }
          return c;
        })
      );
    } catch (err) {
      console.error("Error reacting to comment:", err);
    }
  };

  const renderCommentCard = (comment: Comment, isReply = false, parentCommentId?: string) => {
    const canDelete = isAuthenticated && (user?.id === comment.authorId || user?.id === postAuthorId);
    const totalReactions = comment.reactionsSummary?.total || comment.reactions?.length || 0;

    return (
      <div key={comment.id} className={`flex items-start gap-2.5 group ${isReply ? "mt-2" : "mt-2.5"}`}>
        <img
          src={comment.author.avatar}
          alt={comment.author.name}
          onClick={() => onSelectUser(comment.authorId)}
          className={`${
            isReply ? "w-6 h-6" : "w-7 h-7"
          } rounded-full object-cover border border-slate-200 dark:border-slate-700 cursor-pointer shrink-0 mt-0.5 hover:ring-2 hover:ring-indigo-400 transition-all`}
        />

        <div className="flex-1 min-w-0">
          <div className="bg-slate-50 dark:bg-slate-900/70 p-2.5 sm:p-3 rounded-2xl border border-slate-100 dark:border-slate-800 relative transition-all">
            <div className="flex items-center justify-between gap-2">
              <div
                className="flex items-center gap-1.5 cursor-pointer max-w-[80%]"
                onClick={() => onSelectUser(comment.authorId)}
              >
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 hover:text-indigo-600 truncate">
                  {comment.author.name}
                </span>
                {comment.author.isVerified && <VerifiedBadge size="xs" />}
                <span className="text-[10px] text-slate-400 truncate hidden sm:inline">
                  @{comment.author.username}
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] text-slate-400">
                  {formatTimeAgo(comment.createdAt)}
                </span>
                {canDelete && (
                  <button
                    onClick={() => handleDeleteComment(comment.id, parentCommentId)}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 transition-opacity p-0.5 rounded"
                    title="Xóa bình luận"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Comment Content & Mentions */}
            <p className="text-xs text-slate-700 dark:text-slate-200 mt-1 leading-relaxed break-words whitespace-pre-line">
              {comment.replyToUser && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectUser(comment.replyToUser!.id);
                  }}
                  className="inline-block text-indigo-600 dark:text-indigo-400 font-semibold cursor-pointer mr-1 hover:underline"
                >
                  @{comment.replyToUser.name}
                </span>
              )}
              {comment.content}
            </p>

            {/* Reaction Badge on Corner if active */}
            {totalReactions > 0 && (
              <div className="absolute -bottom-2 right-2 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded-full shadow-xs border border-slate-200 dark:border-slate-700">
                <ReactionSummaryBadge
                  summary={comment.reactionsSummary}
                  total={totalReactions}
                  size="sm"
                />
              </div>
            )}
          </div>

          {/* Comment Action Footer: React + Reply buttons */}
          <div className="flex items-center gap-3 px-2 mt-1">
            <CommentReactionButton
              userReaction={comment.userReaction}
              totalReactions={totalReactions}
              onReact={(type) => handleReactToComment(comment.id, parentCommentId, type)}
              onQuickToggle={() =>
                handleReactToComment(
                  comment.id,
                  parentCommentId,
                  comment.userReaction ? comment.userReaction : "like"
                )
              }
              commentId={comment.id}
            />

            <span className="text-slate-300 dark:text-slate-700 text-[10px]">•</span>

            <button
              type="button"
              onClick={() =>
                handleStartReply(
                  parentCommentId || comment.id,
                  comment.authorId,
                  comment.author.name,
                  comment.author.username
                )
              }
              className="text-[11px] font-semibold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
            >
              Trả lời
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex flex-col gap-3">
      {/* Comments List */}
      <div className="flex flex-col gap-3 max-h-96 overflow-y-auto pr-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-5 text-xs text-slate-400">
            Đang tải bình luận...
          </div>
        ) : comments.length === 0 ? (
          <p className="text-xs text-slate-400 py-3 text-center">
            Chưa có bình luận nào. Hãy là người đầu tiên chia sẻ cảm nghĩ!
          </p>
        ) : (
          comments.map((parentComment) => {
            const hasReplies = parentComment.replies && parentComment.replies.length > 0;
            const isExpanded = Boolean(expandedReplies[parentComment.id]);

            return (
              <div key={parentComment.id} className="flex flex-col">
                {/* Parent Comment */}
                {renderCommentCard(parentComment, false)}

                {/* Nested Replies Section */}
                {hasReplies && (
                  <div className="pl-6 sm:pl-8 ml-3.5 border-l-2 border-slate-100 dark:border-slate-800 flex flex-col mt-1">
                    {/* Toggle Replies button */}
                    <button
                      type="button"
                      onClick={() => toggleRepliesVisibility(parentComment.id)}
                      className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline py-1 self-start"
                    >
                      <CornerDownRight className="w-3.5 h-3.5" />
                      <span>
                        {isExpanded
                          ? `Ẩn ${parentComment.replies!.length} câu trả lời`
                          : `Xem ${parentComment.replies!.length} câu trả lời`}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </button>

                    {/* Replies List */}
                    {isExpanded && (
                      <div className="flex flex-col gap-1.5 animate-in fade-in duration-200">
                        {parentComment.replies!.map((reply) =>
                          renderCommentCard(reply, true, parentComment.id)
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Reply Banner when replying to someone */}
      {replyTarget && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl border border-indigo-100 dark:border-indigo-900/60 text-xs text-indigo-700 dark:text-indigo-300 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center gap-1.5 truncate">
            <CornerDownRight className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span className="truncate">
              Đang trả lời <strong className="font-semibold">{replyTarget.authorName}</strong> (@{replyTarget.authorUsername})
            </span>
          </div>
          <button
            type="button"
            onClick={handleCancelReply}
            className="p-1 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 rounded-full text-indigo-600 dark:text-indigo-400 transition-colors"
            title="Hủy trả lời"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Add Comment / Reply Input Form */}
      <form onSubmit={handleAddComment} className="flex items-center gap-2 mt-0.5">
        {isAuthenticated && user ? (
          <img
            src={user.avatar}
            alt={user.name}
            className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
            <UserIcon className="w-3.5 h-3.5" />
          </div>
        )}

        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            placeholder={
              !isAuthenticated
                ? "Đăng nhập để tham gia bình luận..."
                : replyTarget
                ? `Viết câu trả lời cho @${replyTarget.authorName}...`
                : "Viết bình luận của bạn..."
            }
            className="w-full pl-3 pr-10 py-1.5 text-xs bg-slate-50 dark:bg-slate-900/80 rounded-full border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 transition-all"
          />
          <button
            type="submit"
            disabled={isSubmitting || !newCommentText.trim()}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 disabled:text-slate-300 disabled:hover:bg-transparent transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
};
