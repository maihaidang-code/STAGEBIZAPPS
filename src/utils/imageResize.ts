/**
 * Utility to downscale uploaded images to 300x300 px resolution
 * using client-side HTML5 Canvas.
 */

export async function resizeImageTo300x300(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDim = 300;
        
        let targetWidth = img.width;
        let targetHeight = img.height;

        // Calculate proportional scale to fit within 300x300 px
        if (targetWidth > maxDim || targetHeight > maxDim || targetWidth !== maxDim || targetHeight !== maxDim) {
          if (targetWidth > targetHeight) {
            targetHeight = Math.round((targetHeight * maxDim) / targetWidth);
            targetWidth = maxDim;
          } else {
            targetWidth = Math.round((targetWidth * maxDim) / targetHeight);
            targetHeight = maxDim;
          }
        }

        // Clamp to max 300
        targetWidth = Math.min(maxDim, Math.max(1, targetWidth));
        targetHeight = Math.min(maxDim, Math.max(1, targetHeight));

        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        // High quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        // Export as compressed Data URL (300x300 px max)
        const dataUrl = canvas.toDataURL("image/jpeg", 0.88);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error("Không thể xử lý hình ảnh"));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Lỗi khi đọc file"));
    reader.readAsDataURL(file);
  });
}

export async function resizeMultipleImagesTo300x300(files: FileList | File[]): Promise<string[]> {
  const fileArray = Array.from(files);
  const imageFiles = fileArray.filter((f) => f.type.startsWith("image/"));
  
  const resizePromises = imageFiles.map((file) => resizeImageTo300x300(file));
  return Promise.all(resizePromises);
}
