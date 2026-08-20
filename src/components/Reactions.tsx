import React, { useState, useRef, useEffect } from "react";
import { ThumbsUp, Heart, Smile, Sparkles, AlertCircle } from "lucide-react";
import { ReactionType, ReactionSummary } from "../types";

export interface ReactionConfig {
  type: ReactionType;
  label: string;
  emoji: string;
  colorClass: string;
  textColorClass: string;
  bgActive: string;
  iconBg: string;
}

export const REACTIONS_DATA: Record<ReactionType, ReactionConfig> = {
  like: {
    type: "like",
    label: "Thích",
    emoji: "👍",
    colorClass: "text-blue-500",
    textColorClass: "text-blue-600 dark:text-blue-400 font-bold",
    bgActive: "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold",
    iconBg: "bg-blue-500",
  },
  love: {
    type: "love",
    label: "Yêu thích",
    emoji: "❤️",
    colorClass: "text-rose-500",
    textColorClass: "text-rose-600 dark:text-rose-400 font-bold",
    bgActive: "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold",
    iconBg: "bg-rose-500",
  },
  haha: {
    type: "haha",
    label: "Haha",
    emoji: "😆",
    colorClass: "text-amber-500",
    textColorClass: "text-amber-600 dark:text-amber-400 font-bold",
    bgActive: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 font-bold",
    iconBg: "bg-amber-500",
  },
  wow: {
    type: "wow",
    label: "Wow",
    emoji: "😮",
    colorClass: "text-amber-500",
    textColorClass: "text-amber-600 dark:text-amber-400 font-bold",
    bgActive: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 font-bold",
    iconBg: "bg-amber-500",
  },
  sad: {
    type: "sad",
    label: "Buồn",
    emoji: "😢",
    colorClass: "text-amber-600",
    textColorClass: "text-amber-600 dark:text-amber-400 font-bold",
    bgActive: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 font-bold",
    iconBg: "bg-amber-600",
  },
  angry: {
    type: "angry",
    label: "Phẫn nộ",
    emoji: "😡",
    colorClass: "text-orange-600",
    textColorClass: "text-orange-600 dark:text-orange-400 font-bold",
    bgActive: "bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-bold",
    iconBg: "bg-orange-600",
  },
};

export const ORDERED_REACTIONS: ReactionType[] = ["like", "love", "haha", "wow", "sad", "angry"];

// Floating Reaction Picker Bar
interface ReactionPickerProps {
  onSelectReaction: (type: ReactionType) => void;
  onClose?: () => void;
}

export const ReactionPicker: React.FC<ReactionPickerProps> = ({ onSelectReaction, onClose }) => {
  const [hoveredReaction, setHoveredReaction] = useState<ReactionType | null>(null);

  return (
    <div
      role="tooltip"
      className="absolute bottom-full left-0 mb-2.5 z-40 flex items-center gap-1.5 p-1.5 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md rounded-full shadow-xl border border-slate-200/80 dark:border-slate-700/80 animate-in fade-in zoom-in-95 duration-150"
      onMouseLeave={onClose}
    >
      {ORDERED_REACTIONS.map((type) => {
        const item = REACTIONS_DATA[type];
        const isHovered = hoveredReaction === type;

        return (
          <button
            key={type}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectReaction(type);
              if (onClose) onClose();
            }}
            onMouseEnter={() => setHoveredReaction(type)}
            onMouseLeave={() => setHoveredReaction(null)}
            className="group relative p-1 text-xl sm:text-2xl transition-transform duration-200 hover:scale-135 active:scale-95 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700/60"
            title={item.label}
          >
            <span className="transform transition-transform select-none inline-block filter drop-shadow-xs">
              {item.emoji}
            </span>

            {/* Tooltip Label */}
            {isHovered && (
              <span className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-slate-900/90 text-white text-[10px] font-semibold rounded-full whitespace-nowrap shadow-sm pointer-events-none">
                {item.label}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

// Summary Display (stacked icons like 👍❤️😆 + count)
interface ReactionSummaryBadgeProps {
  summary?: ReactionSummary;
  total?: number;
  onClick?: () => void;
  size?: "sm" | "md";
}

export const ReactionSummaryBadge: React.FC<ReactionSummaryBadgeProps> = ({
  summary,
  total = 0,
  onClick,
  size = "sm",
}) => {
  if (!summary || total <= 0) return null;

  // Find top reactions that have counts > 0
  const activeTypes = ORDERED_REACTIONS.filter((t) => (summary[t] || 0) > 0).sort(
    (a, b) => (summary[b] || 0) - (summary[a] || 0)
  );

  if (activeTypes.length === 0) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      title="Xem danh sách người đã bày tỏ cảm xúc"
      className={`group inline-flex items-center gap-1.5 cursor-pointer select-none text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-all rounded-md px-1 py-0.5 hover:bg-slate-100 dark:hover:bg-slate-750 ${
        size === "sm" ? "text-xs" : "text-sm"
      }`}
    >
      <div className="flex items-center -space-x-1">
        {activeTypes.slice(0, 3).map((type) => (
          <span
            key={type}
            className="inline-flex items-center justify-center w-4 h-4 text-[11px] rounded-full ring-1 ring-white dark:ring-slate-800 bg-slate-100 dark:bg-slate-700 shadow-2xs group-hover:scale-110 transition-transform"
          >
            {REACTIONS_DATA[type].emoji}
          </span>
        ))}
      </div>
      <span className="font-semibold text-slate-600 dark:text-slate-300 group-hover:underline">{total}</span>
    </button>
  );
};

// Interactive Post Reaction Button
interface PostReactionButtonProps {
  userReaction?: ReactionType | null;
  likesCount: number;
  reactionsSummary?: ReactionSummary;
  onReact: (type: ReactionType) => void;
  onQuickToggle: () => void;
  idPrefix?: string;
}

export const PostReactionButton: React.FC<PostReactionButtonProps> = ({
  userReaction,
  likesCount,
  onReact,
  onQuickToggle,
  idPrefix = "post",
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const hoverTimeoutRef = useRef<number | null>(null);

  const handleMouseEnter = () => {
    hoverTimeoutRef.current = window.setTimeout(() => {
      setShowPicker(true);
    }, 280);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
  };

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  const currentConfig = userReaction ? REACTIONS_DATA[userReaction] : null;

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {showPicker && (
        <ReactionPicker
          onSelectReaction={(type) => {
            setShowPicker(false);
            onReact(type);
          }}
          onClose={() => setShowPicker(false)}
        />
      )}

      <button
        id={`btn-react-${idPrefix}`}
        onClick={(e) => {
          e.stopPropagation();
          onQuickToggle();
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          setShowPicker(true);
        }}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-all active:scale-95 ${
          currentConfig
            ? currentConfig.bgActive
            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 font-semibold"
        }`}
      >
        {currentConfig ? (
          <span className="text-sm select-none animate-in zoom-in duration-200">
            {currentConfig.emoji}
          </span>
        ) : (
          <ThumbsUp className="w-4 h-4 text-slate-500 dark:text-slate-400" />
        )}

        <span>
          {currentConfig ? currentConfig.label : "Thích"}
        </span>

        {likesCount > 0 && (
          <span className="opacity-90 font-medium ml-0.5">({likesCount})</span>
        )}
      </button>
    </div>
  );
};

// Interactive Comment Reaction Trigger
interface CommentReactionButtonProps {
  userReaction?: ReactionType | null;
  totalReactions: number;
  onReact: (type: ReactionType) => void;
  onQuickToggle: () => void;
  commentId: string;
}

export const CommentReactionButton: React.FC<CommentReactionButtonProps> = ({
  userReaction,
  totalReactions,
  onReact,
  onQuickToggle,
  commentId,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const hoverTimeoutRef = useRef<number | null>(null);

  const handleMouseEnter = () => {
    hoverTimeoutRef.current = window.setTimeout(() => {
      setShowPicker(true);
    }, 280);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
  };

  const currentConfig = userReaction ? REACTIONS_DATA[userReaction] : null;

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {showPicker && (
        <ReactionPicker
          onSelectReaction={(type) => {
            setShowPicker(false);
            onReact(type);
          }}
          onClose={() => setShowPicker(false)}
        />
      )}

      <button
        type="button"
        id={`btn-comment-react-${commentId}`}
        onClick={(e) => {
          e.stopPropagation();
          onQuickToggle();
        }}
        className={`text-[11px] font-semibold hover:underline transition-colors flex items-center gap-1 ${
          currentConfig
            ? currentConfig.textColorClass
            : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
        }`}
      >
        {currentConfig ? (
          <>
            <span>{currentConfig.emoji}</span>
            <span>{currentConfig.label}</span>
          </>
        ) : (
          <span>Thích</span>
        )}
      </button>
    </div>
  );
};
