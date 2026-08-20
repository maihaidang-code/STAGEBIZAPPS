import React, { useState, useEffect } from "react";
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  Heart, 
  MessageSquare, 
  UserPlus, 
  ShieldCheck, 
  ShieldAlert, 
  Users, 
  CheckCircle, 
  XCircle, 
  Filter, 
  RefreshCw,
  Sparkles,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { api } from "../services/api";
import { Notification, NotificationType } from "../types";
import { VerifiedBadge } from "./VerifiedBadge";

interface NotificationsViewProps {
  onSelectUser: (userId: string) => void;
  onSelectChatRoom?: (roomId: string) => void;
  onShowToast: (text: string, type: "success" | "error" | "info") => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  onSelectUser,
  onSelectChatRoom,
  onShowToast,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");
  const [unreadOnly, setUnreadOnly] = useState(false);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const data = await api.getNotifications({
        unreadOnly: unreadOnly ? true : undefined,
        type: filterType === "all" ? undefined : filterType,
      });
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không thể tải thông báo";
      onShowToast(msg, "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [filterType, unreadOnly]);

  const handleMarkAsRead = async (notif: Notification, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (notif.isRead) return;

    try {
      const res = await api.markNotificationAsRead(notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
      );
      setUnreadCount(res.unreadCount);
    } catch {
      // silent
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res = await api.markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(res.unreadCount);
      onShowToast("Đã đánh dấu tất cả thông báo là đã đọc", "success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Thao tác thất bại";
      onShowToast(msg, "error");
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await api.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setUnreadCount(res.unreadCount);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không thể xóa thông báo";
      onShowToast(msg, "error");
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa toàn bộ danh sách thông báo?")) return;
    try {
      const res = await api.clearAllNotifications();
      setNotifications([]);
      setUnreadCount(res.unreadCount);
      onShowToast("Đã dọn dẹp sạch thông báo", "info");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Thao tác thất bại";
      onShowToast(msg, "error");
    }
  };

  const handleNotificationClick = (notif: Notification) => {
    handleMarkAsRead(notif);

    if (notif.targetType === "chat_room" && notif.targetId && onSelectChatRoom) {
      onSelectChatRoom(notif.targetId);
    } else if (notif.targetType === "profile" && notif.targetId) {
      onSelectUser(notif.targetId);
    } else if (notif.sender?.id) {
      onSelectUser(notif.sender.id);
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case "post_reaction":
      case "comment_reaction":
        return <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />;
      case "post_comment":
      case "comment_reply":
        return <MessageSquare className="w-4 h-4 text-indigo-500" />;
      case "user_follow":
        return <UserPlus className="w-4 h-4 text-sky-500" />;
      case "chat_request":
        return <Users className="w-4 h-4 text-amber-500" />;
      case "chat_approval":
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case "chat_rejection":
        return <XCircle className="w-4 h-4 text-rose-500" />;
      case "verification_submitted":
        return <ShieldCheck className="w-4 h-4 text-sky-500" />;
      case "verification_approved":
        return <ShieldCheck className="w-4 h-4 text-emerald-500" />;
      case "verification_rejected":
      case "verification_revoked":
        return <ShieldAlert className="w-4 h-4 text-rose-500" />;
      default:
        return <Bell className="w-4 h-4 text-slate-500" />;
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 60) return "Vừa xong";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} phút trước`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} giờ trước`;
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay < 7) return `${diffDay} ngày trước`;
    return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 p-5 shadow-xs flex flex-col gap-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-700/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center relative">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white rounded-full text-[10px] font-extrabold flex items-center justify-center ring-2 ring-white dark:ring-slate-800">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>Trung tâm Thông báo</span>
              {unreadCount > 0 && (
                <span className="text-xs bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 font-bold px-2 py-0.5 rounded-full">
                  {unreadCount} mới
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400">
              Cập nhật các tương tác, tin nhắn, yêu cầu tham gia box chat và kết quả duyệt Tick Xanh
            </p>
          </div>
        </div>

        {/* Global actions */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 transition-colors"
              title="Đánh dấu tất cả đã đọc"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Đã đọc tất cả</span>
            </button>
          )}

          {notifications.length > 0 && (
            <button
              onClick={handleClearAll}
              className="p-1.5 text-xs font-semibold rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title="Xóa tất cả thông báo"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={fetchNotifications}
            disabled={isLoading}
            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
            title="Làm mới"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-indigo-500" : ""}`} />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {[
          { id: "all", label: "Tất cả" },
          { id: "reactions", label: "Tương tác (Tim)" },
          { id: "comments", label: "Bình luận" },
          { id: "chat", label: "Box Chat" },
          { id: "verification", label: "Tick Xanh" },
        ].map((tab) => {
          const isActive = filterType === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/60 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
              }`}
            >
              {tab.label}
            </button>
          );
        })}

        <button
          onClick={() => setUnreadOnly(!unreadOnly)}
          className={`ml-auto px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
            unreadOnly
              ? "bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/60 dark:border-rose-800 dark:text-rose-300"
              : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50"
          }`}
        >
          {unreadOnly ? "Chỉ chưa đọc ✓" : "Chỉ chưa đọc"}
        </button>
      </div>

      {/* Notifications List */}
      {isLoading ? (
        <div className="py-14 text-center">
          <div className="w-7 h-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-slate-400">Đang tải thông báo...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="py-16 text-center bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700/60 p-6 flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-500">
            <Bell className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            {unreadOnly ? "Bạn đã đọc hết tất cả thông báo!" : "Chưa có thông báo nào"}
          </h4>
          <p className="text-xs text-slate-400 max-w-sm">
            Khi có ai đó thích bài viết, bình luận, gửi yêu cầu vào box chat hoặc có cập nhật về Tick Xanh, bạn sẽ thấy thông báo tại đây.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className={`p-3.5 rounded-xl border transition-all flex items-start gap-3 cursor-pointer group ${
                notif.isRead
                  ? "bg-white dark:bg-slate-800/80 border-slate-200/70 dark:border-slate-700/70 hover:bg-slate-50 dark:hover:bg-slate-750"
                  : "bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-200/80 dark:border-indigo-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 shadow-xs"
              }`}
            >
              {/* Avatar + Sub-Icon */}
              <div className="relative shrink-0">
                <img
                  src={notif.sender?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"}
                  alt={notif.sender?.name || "Hệ thống"}
                  className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                />
                <div className="absolute -bottom-1 -right-1 p-1 bg-white dark:bg-slate-800 rounded-full shadow-xs ring-1 ring-slate-100 dark:ring-slate-700">
                  {getNotificationIcon(notif.type)}
                </div>
              </div>

              {/* Content text */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                    {notif.title}
                  </h4>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">
                    {formatTime(notif.createdAt)}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-2 leading-relaxed">
                  {notif.message}
                </p>

                {/* Extra metadata preview */}
                {notif.metadata?.roomCode && (
                  <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-[10px] font-mono text-indigo-600 dark:text-indigo-300">
                    <span>Mã phòng: {notif.metadata.roomCode}</span>
                  </div>
                )}
              </div>

              {/* Status and Action Buttons */}
              <div className="flex items-center gap-1.5 shrink-0 self-center">
                {!notif.isRead && (
                  <span className="w-2.5 h-2.5 bg-indigo-600 rounded-full shrink-0" title="Chưa đọc"></span>
                )}

                <button
                  onClick={(e) => handleDelete(notif.id, e)}
                  className="p-1 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 opacity-0 group-hover:opacity-100 transition-all"
                  title="Xóa thông báo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
