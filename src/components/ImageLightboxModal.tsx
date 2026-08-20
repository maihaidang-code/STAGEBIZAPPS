import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ImageLightboxModalProps {
  imageUrl: string | null;
  images?: string[];
  initialIndex?: number;
  altText?: string;
  onClose: () => void;
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  imageUrl,
  images,
  initialIndex = 0,
  altText,
  onClose,
}) => {
  const allImages = images && images.length > 0 ? images : imageUrl ? [imageUrl] : [];
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    if (images && images.length > 0) {
      if (initialIndex >= 0 && initialIndex < images.length) {
        setCurrentIndex(initialIndex);
      } else if (imageUrl) {
        const found = images.indexOf(imageUrl);
        setCurrentIndex(found >= 0 ? found : 0);
      }
    } else {
      setCurrentIndex(0);
    }
  }, [imageUrl, images, initialIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : allImages.length - 1));
      } else if (e.key === "ArrowRight") {
        setCurrentIndex((prev) => (prev < allImages.length - 1 ? prev + 1 : 0));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [allImages.length, onClose]);

  if (allImages.length === 0) return null;

  const currentImg = allImages[currentIndex] || allImages[0];

  return createPortal(
    <AnimatePresence>
      <div id="image-lightbox-portal" className="fixed inset-0 z-[9999] overflow-y-auto">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-md transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Centering container */}
        <div className="flex min-h-full items-center justify-center p-2 sm:p-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            onClick={(e) => e.stopPropagation()}
            className="relative my-auto max-w-5xl w-full flex flex-col items-center justify-center pointer-events-auto"
          >
            {/* Top Toolbar */}
            <div className="w-full flex items-center justify-between px-2 py-3 text-white">
              <div className="flex items-center gap-2">
                {allImages.length > 1 && (
                  <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-white/90 border border-white/10">
                    Ảnh {currentIndex + 1} / {allImages.length}
                  </span>
                )}
                <span className="px-2.5 py-0.5 rounded-md bg-white/10 text-[11px] font-mono text-white/75">
                  300x300 px
                </span>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={currentImg}
                  target="_blank"
                  rel="noreferrer"
                  title="Mở ảnh gốc"
                  className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  onClick={onClose}
                  className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors cursor-pointer"
                  title="Đóng (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Main Image Stage */}
            <div className="relative w-full flex items-center justify-center min-h-[300px] max-h-[75vh]">
              {/* Prev Button */}
              {allImages.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : allImages.length - 1))
                  }
                  className="absolute left-2 sm:left-4 z-20 p-2.5 sm:p-3 rounded-full bg-black/60 hover:bg-black/80 text-white/90 hover:text-white backdrop-blur-md border border-white/15 shadow-xl transition-transform hover:scale-110 active:scale-95 cursor-pointer"
                  title="Ảnh trước (Mũi tên trái)"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}

              <img
                key={currentIndex}
                src={currentImg}
                alt={altText || `Ảnh phóng to ${currentIndex + 1}`}
                className="max-h-[75vh] max-w-full object-contain rounded-2xl shadow-2xl border border-white/10 select-none animate-in fade-in zoom-in-95 duration-200"
              />

              {/* Next Button */}
              {allImages.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setCurrentIndex((prev) => (prev < allImages.length - 1 ? prev + 1 : 0))
                  }
                  className="absolute right-2 sm:right-4 z-20 p-2.5 sm:p-3 rounded-full bg-black/60 hover:bg-black/80 text-white/90 hover:text-white backdrop-blur-md border border-white/15 shadow-xl transition-transform hover:scale-110 active:scale-95 cursor-pointer"
                  title="Ảnh tiếp theo (Mũi tên phải)"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}
            </div>

            {/* Bottom Thumbnails Strip for Multiple Images */}
            {allImages.length > 1 && (
              <div className="flex items-center gap-2 mt-4 max-w-full overflow-x-auto p-2 bg-black/40 rounded-xl backdrop-blur-md border border-white/10">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={`relative rounded-lg overflow-hidden w-12 h-12 shrink-0 border-2 transition-all cursor-pointer ${
                      currentIndex === idx
                        ? "border-indigo-500 scale-105 shadow-md shadow-indigo-500/30"
                        : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
