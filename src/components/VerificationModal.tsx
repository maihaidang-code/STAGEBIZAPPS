import React, { useState } from "react";
import { createPortal } from "react-dom";
import { X, CheckCircle2, ShieldCheck, AlertCircle, Sparkles, Link, FileText, Award } from "lucide-react";
import { api } from "../services/api";
import { VerificationRequest } from "../types";

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (request: VerificationRequest) => void;
  onShowToast: (text: string, type: "success" | "error" | "info") => void;
}

const CATEGORIES = [
  "Ca sĩ / Nhạc sĩ",
  "Diễn viên / Sân khấu kịch",
  "Đạo diễn / Biên kịch",
  "Người dẫn chương trình (MC)",
  "Nhà sản xuất / Âm nhạc",
  "Nghệ sĩ múa / Vũ công",
  "Nhà tổ chức sự kiện & Showbiz",
  "Doanh nghiệp / Đơn vị truyền thông",
  "Nhà sáng tạo nội dung nghệ thuật",
  "Khác",
];

export const VerificationModal: React.FC<VerificationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onShowToast,
}) => {
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [reason, setReason] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!category) {
      setError("Vui lòng chọn lĩnh vực hoạt động nghệ thuật");
      return;
    }

    if (!reason.trim() || reason.trim().length < 15) {
      setError("Vui lòng nhập lý do và thông tin giới thiệu hoạt động (tối thiểu 15 ký tự)");
      return;
    }

    setIsSubmitting(true);
    try {
      const request = await api.submitVerificationRequest({
        category,
        reason: reason.trim(),
        evidenceUrl: evidenceUrl.trim() || undefined,
      });

      onShowToast("Đã gửi hồ sơ xin cấp Tick Xanh tới Ban Quản Trị thành công!", "success");
      onSuccess(request);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gửi yêu cầu thất bại";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div id="verification-modal-portal" className="fixed inset-0 z-[9999] overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity" 
        onClick={onClose}
        aria-hidden="true" 
      />

      {/* Centering container */}
      <div className="flex min-h-full items-center justify-center p-3 sm:p-4 text-center">
        <div 
          className="relative transform overflow-hidden rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 text-left shadow-2xl border border-slate-200 dark:border-slate-800 transition-all w-full max-w-lg my-auto flex flex-col max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3.5rem)] animate-in fade-in zoom-in-95 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-5 bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-transparent border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center shadow-md shadow-sky-500/25">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                Yêu cầu cấp Huy hiệu Xác minh (Tick Xanh)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Chứng thực tài khoản chính chủ cho nghệ sĩ & chuyên gia nghệ thuật
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Benefits banner */}
        <div className="px-5 py-3 bg-sky-50 dark:bg-sky-950/40 border-b border-sky-100 dark:border-sky-900/50 flex items-center gap-2 text-xs text-sky-800 dark:text-sky-200">
          <Sparkles className="w-4 h-4 text-sky-500 shrink-0" />
          <span>Huy hiệu Tick Xanh giúp tăng độ uy tín, bảo vệ bản quyền nghệ sĩ và mở rộng kết nối trong cộng đồng sân khấu.</span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-indigo-500" />
              <span>Lĩnh vực hoạt động nghệ thuật <strong className="text-rose-500">*</strong></span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500 transition-all font-medium"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-500" />
              <span>Lý do & Tóm tắt hoạt động chuyên môn <strong className="text-rose-500">*</strong></span>
            </label>
            <textarea
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Giới thiệu sơ lược về vai trò của bạn, các tác phẩm/sự kiện tiêu biểu đã tham gia hoặc lý do bạn cần huy hiệu xác minh chính chủ..."
              className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500 transition-all resize-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Link className="w-3.5 h-3.5 text-indigo-500" />
              <span>Link hồ sơ chứng minh / Portfolio / Bài báo / Trang cá nhân xác thực (Tùy chọn)</span>
            </label>
            <input
              type="url"
              value={evidenceUrl}
              onChange={(e) => setEvidenceUrl(e.target.value)}
              placeholder="https://facebook.com/..., https://youtube.com/..., hoặc link bài báo"
              className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500 transition-all"
            />
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
            <p className="font-semibold text-slate-700 dark:text-slate-300">Quy trình thẩm định:</p>
            <p>1. Hồ sơ của bạn sẽ được gửi trực tiếp đến Ban Quản Trị (Admin).</p>
            <p>2. Admin sẽ xem xét các tiêu chuẩn xác minh và thông báo kết quả qua mục Thông báo.</p>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Hủy
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white shadow-md shadow-sky-500/25 transition-all flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Đang gửi hồ sơ...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Gửi yêu cầu xác minh</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>,
  document.body
);
};
