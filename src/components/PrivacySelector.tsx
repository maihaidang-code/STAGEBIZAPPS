import React, { useState, useRef, useEffect } from "react";
import { Globe, UserCheck, Users, Lock, ChevronDown, Check } from "lucide-react";
import { PostVisibility } from "../types";

export interface PrivacyOption {
  value: PostVisibility;
  label: string;
  shortLabel: string;
  description: string;
  icon: React.FC<{ className?: string }>;
  color: string;
  bgBadge: string;
}

export const PRIVACY_OPTIONS: PrivacyOption[] = [
  {
    value: "public",
    label: "Mọi người (Công khai)",
    shortLabel: "Mọi người",
    description: "Bất kỳ ai trên StageBiz đều có thể xem bài viết",
    icon: Globe,
    color: "text-sky-600 dark:text-sky-400",
    bgBadge: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800",
  },
  {
    value: "followers",
    label: "Người theo dõi",
    shortLabel: "Người theo dõi",
    description: "Chỉ những người đang theo dõi bạn mới xem được",
    icon: UserCheck,
    color: "text-indigo-600 dark:text-indigo-400",
    bgBadge: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800",
  },
  {
    value: "friends",
    label: "Bạn bè (Theo dõi 2 chiều)",
    shortLabel: "Bạn bè",
    description: "Chỉ những người bạn theo dõi và họ cũng theo dõi lại bạn",
    icon: Users,
    color: "text-emerald-600 dark:text-emerald-400",
    bgBadge: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
  },
  {
    value: "private",
    label: "Chỉ mình tôi",
    shortLabel: "Chỉ mình tôi",
    description: "Chỉ có bạn mới xem được bài viết này trên trang cá nhân",
    icon: Lock,
    color: "text-amber-600 dark:text-amber-400",
    bgBadge: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800",
  },
];

interface PrivacySelectorProps {
  value: PostVisibility;
  onChange: (val: PostVisibility) => void;
  size?: "sm" | "md";
  className?: string;
  disabled?: boolean;
}

export const PrivacySelector: React.FC<PrivacySelectorProps> = ({
  value,
  onChange,
  size = "md",
  className = "",
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentOption = PRIVACY_OPTIONS.find((opt) => opt.value === value) || PRIVACY_OPTIONS[0];
  const Icon = currentOption.icon;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div className={`relative inline-block text-left ${className}`} ref={containerRef}>
      <button
        type="button"
        id="privacy-selector-btn"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 rounded-lg border font-semibold transition-all select-none ${
          size === "sm"
            ? "px-2 py-1 text-[11px]"
            : "px-2.5 py-1.5 text-xs"
        } ${currentOption.bgBadge} hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`}
        title={`Chế độ hiển thị: ${currentOption.label}`}
      >
        <Icon className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />
        <span>{currentOption.shortLabel}</span>
        <ChevronDown className={`${size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} opacity-70`} />
      </button>

      {isOpen && (
        <div
          id="privacy-selector-dropdown"
          className="absolute left-0 mt-1.5 w-64 rounded-xl bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-700/60">
            Chọn ai có thể xem bài viết
          </div>
          {PRIVACY_OPTIONS.map((option) => {
            const OptIcon = option.icon;
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                id={`privacy-opt-${option.value}`}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-2 text-left flex items-start gap-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors ${
                  isSelected ? "bg-indigo-50/70 dark:bg-indigo-950/40" : ""
                }`}
              >
                <div className={`p-1.5 rounded-lg mt-0.5 ${isSelected ? "bg-indigo-100 dark:bg-indigo-900/60" : "bg-slate-100 dark:bg-slate-700"}`}>
                  <OptIcon className={`w-4 h-4 ${option.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${isSelected ? "text-indigo-600 dark:text-indigo-400" : "text-slate-800 dark:text-slate-200"}`}>
                      {option.label}
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                    {option.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const PostPrivacyBadge: React.FC<{ visibility?: PostVisibility; className?: string }> = ({
  visibility = "public",
  className = "",
}) => {
  const option = PRIVACY_OPTIONS.find((opt) => opt.value === visibility) || PRIVACY_OPTIONS[0];
  const Icon = option.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md border ${option.bgBadge} ${className}`}
      title={`Chế độ hiển thị: ${option.label}`}
    >
      <Icon className="w-2.5 h-2.5" />
      <span>{option.shortLabel}</span>
    </span>
  );
};
