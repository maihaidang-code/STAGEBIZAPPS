import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ExternalLink, 
  User as UserIcon, 
  Search, 
  RefreshCw,
  AlertCircle,
  Award,
  Filter,
  X
} from "lucide-react";
import { api } from "../services/api";
import { VerificationRequest, User } from "../types";
import { VerifiedBadge } from "./VerifiedBadge";

interface AdminVerificationPanelProps {
  onSelectUser: (userId: string) => void;
  onShowToast: (text: string, type: "success" | "error" | "info") => void;
}

export const AdminVerificationPanel: React.FC<AdminVerificationPanelProps> = ({
  onSelectUser,
  onShowToast,
}) => {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("pending");
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Reject modal / dialog state
  const [rejectingRequest, setRejectingRequest] = useState<VerificationRequest | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const loadRequests = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAdminVerificationRequests(filterStatus === "all" ? undefined : filterStatus);
      setRequests(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không thể tải danh sách yêu cầu xác minh";
      onShowToast(msg, "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [filterStatus]);

  const handleApprove = async (request: VerificationRequest) => {
    if (!window.confirm(`Bạn có chắc chắn muốn cấp Tick Xanh chính chủ cho @${request.user?.username || "người dùng"}?`)) {
      return;
    }

    setProcessingId(request.id);
    try {
      const result = await api.approveVerificationRequest(request.id, "Đạt chuẩn xét duyệt nghệ sĩ chính chủ StageBiz");
      onShowToast(`Đã cấp Tick Xanh cho @${result.user.username} thành công!`, "success");
      
      // Update local state
      setRequests((prev) =>
        prev.map((r) => (r.id === request.id ? result.request : r))
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Phê duyệt thất bại";
      onShowToast(msg, "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingRequest) return;

    setProcessingId(rejectingRequest.id);
    try {
      const updated = await api.rejectVerificationRequest(
        rejectingRequest.id,
        rejectReason.trim() || "Chưa cung cấp đủ thông tin chứng minh hoạt động chuyên môn"
      );
      onShowToast(`Đã từ chối yêu cầu của @${rejectingRequest.user?.username}`, "info");

      setRequests((prev) =>
        prev.map((r) => (r.id === rejectingRequest.id ? updated : r))
      );
      setRejectingRequest(null);
      setRejectReason("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Từ chối thất bại";
      onShowToast(msg, "error");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 p-5 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-700/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-sky-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>Ban Quản Trị: Thẩm định Tick Xanh</span>
              <span className="text-[10px] uppercase font-extrabold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 px-2 py-0.5 rounded-md">
                Admin
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Xem xét, phê duyệt hoặc thu hồi huy hiệu xác minh nghệ sĩ chính chủ
            </p>
          </div>
        </div>

        <button
          onClick={loadRequests}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-indigo-500" : ""}`} />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 py-3 overflow-x-auto">
        {[
          { id: "pending", label: "Chờ duyệt", icon: Clock },
          { id: "approved", label: "Đã cấp tick", icon: CheckCircle2 },
          { id: "rejected", label: "Đã từ chối", icon: XCircle },
          { id: "all", label: "Tất cả hồ sơ", icon: Filter },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = filterStatus === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/60 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Requests List */}
      {isLoading ? (
        <div className="py-12 text-center">
          <div className="w-7 h-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-slate-400">Đang tải danh sách hồ sơ xác minh...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="py-12 text-center bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700/60 p-6">
          <Award className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Không có hồ sơ nào ở mục này</p>
          <p className="text-xs text-slate-400 mt-1">Khi thành viên gửi yêu cầu cấp tick xanh, hồ sơ sẽ hiển thị tại đây.</p>
        </div>
      ) : (
        <div className="space-y-3.5 mt-2">
          {requests.map((req) => (
            <div
              key={req.id}
              className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-700/70 flex flex-col gap-3 transition-all hover:border-slate-300 dark:hover:border-slate-600"
            >
              {/* User info row */}
              <div className="flex items-start justify-between gap-3">
                <div
                  className="flex items-center gap-3 cursor-pointer group"
                  onClick={() => req.user && onSelectUser(req.user.id)}
                >
                  <img
                    src={req.user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"}
                    alt={req.user?.name || "Người dùng"}
                    className="w-11 h-11 rounded-full object-cover border border-slate-200 dark:border-slate-700 group-hover:ring-2 group-hover:ring-indigo-400 transition-all"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {req.user?.name}
                      </h4>
                      {req.user?.isVerified && <VerifiedBadge size="sm" />}
                    </div>
                    <p className="text-xs text-slate-400">@{req.user?.username}</p>
                  </div>
                </div>

                {/* Status Badge */}
                <div>
                  {req.status === "pending" && (
                    <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                      <Clock className="w-3 h-3" />
                      <span>Chờ duyệt</span>
                    </span>
                  )}
                  {req.status === "approved" && (
                    <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Đã cấp Tick</span>
                    </span>
                  )}
                  {req.status === "rejected" && (
                    <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300">
                      <XCircle className="w-3 h-3" />
                      <span>Đã từ chối</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Request Details */}
              <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200/60 dark:border-slate-700/60 text-xs space-y-1.5">
                <div className="flex items-center gap-2 text-slate-500">
                  <Award className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Lĩnh vực xin cấp: <strong className="text-slate-800 dark:text-slate-200">{req.category}</strong></span>
                </div>

                <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                  <span className="font-semibold text-slate-500">Lý do / Hoạt động:</span> {req.reason}
                </p>

                {req.evidenceUrl && (
                  <div className="pt-1">
                    <a
                      href={req.evidenceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sky-600 dark:text-sky-400 hover:underline font-semibold"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Xem link hồ sơ chứng minh</span>
                    </a>
                  </div>
                )}

                {req.adminNotes && (
                  <div className="p-2 bg-slate-50 dark:bg-slate-900/60 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Ghi chú Admin:</span> {req.adminNotes} (Bởi {req.reviewedBy})
                  </div>
                )}
              </div>

              {/* Action Buttons for Pending */}
              {req.status === "pending" && (
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => {
                      setRejectingRequest(req);
                      setRejectReason("");
                    }}
                    disabled={processingId === req.id}
                    className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-slate-200 hover:bg-rose-100 hover:text-rose-700 dark:bg-slate-700 dark:hover:bg-rose-950 dark:hover:text-rose-300 text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Từ chối</span>
                  </button>

                  <button
                    onClick={() => handleApprove(req)}
                    disabled={processingId === req.id}
                    className="px-4 py-1.5 text-xs font-bold rounded-xl bg-sky-500 hover:bg-sky-600 text-white shadow-xs transition-all flex items-center gap-1.5"
                  >
                    {processingId === req.id ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    <span>Phê duyệt & Cấp Tick Xanh</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Reject Reason Dialog */}
      {rejectingRequest && createPortal(
        <div id="reject-modal-portal" className="fixed inset-0 z-[9999] overflow-y-auto">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity" 
            onClick={() => setRejectingRequest(null)}
            aria-hidden="true" 
          />

          {/* Centering container */}
          <div className="flex min-h-full items-center justify-center p-3 sm:p-4 text-center">
            <div 
              className="relative transform overflow-hidden rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 text-left shadow-2xl border border-slate-200 dark:border-slate-800 transition-all w-full max-w-md my-auto p-5 sm:p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-rose-500" />
                  <span>Từ chối cấp Tick Xanh</span>
                </h3>
                <button
                  onClick={() => setRejectingRequest(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-500">
                Bạn đang từ chối yêu cầu của <strong>@{rejectingRequest.user?.username}</strong>. Hãy cung cấp lý do để gửi thông báo hướng dẫn cho người dùng:
              </p>

              <form onSubmit={handleConfirmReject} className="space-y-3">
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Nhập lý do từ chối (Ví dụ: Cần bổ sung thêm link minh chứng tác phẩm hoặc hồ sơ chưa đạt chuẩn số lượng người theo dõi)..."
                  className="w-full p-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                  required
                />

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setRejectingRequest(null)}
                    className="px-3.5 py-1.5 text-xs font-bold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Đóng
                  </button>
                  <button
                    type="submit"
                    disabled={processingId === rejectingRequest.id}
                    className="px-4 py-1.5 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-all cursor-pointer"
                  >
                    Xác nhận từ chối
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
