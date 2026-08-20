import React from "react";
import { BadgeCheck } from "lucide-react";

interface VerifiedBadgeProps {
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  showText?: boolean;
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  size = "sm",
  className = "",
  showText = false,
}) => {
  const sizeMap = {
    xs: "w-3 h-3",
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 select-none ${className}`}
      title="Tài khoản đã xác minh chính chủ trên StageBiz"
    >
      <BadgeCheck
        className={`${sizeMap[size]} text-sky-500 fill-sky-500 text-white shrink-0 inline-block drop-shadow-xs`}
      />
      {showText && (
        <span className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 px-1.5 py-0.2 rounded-md">
          Đã xác minh
        </span>
      )}
    </span>
  );
};
