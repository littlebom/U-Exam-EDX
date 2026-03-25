"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, Loader2, Crop } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TARGET_WIDTH = 900;
const TARGET_HEIGHT = 506; // 16:9
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB input limit

interface CoverImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  className?: string;
}

/**
 * Resize + center-crop image to 900x506 (16:9) using canvas
 * Returns a Blob ready for upload
 */
function resizeAndCrop(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = TARGET_WIDTH;
      canvas.height = TARGET_HEIGHT;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas not supported"));

      // Calculate crop area (center crop to 16:9)
      const targetRatio = TARGET_WIDTH / TARGET_HEIGHT;
      const imgRatio = img.width / img.height;

      let sx = 0,
        sy = 0,
        sw = img.width,
        sh = img.height;

      if (imgRatio > targetRatio) {
        // Image is wider — crop sides
        sw = img.height * targetRatio;
        sx = (img.width - sw) / 2;
      } else {
        // Image is taller — crop top/bottom
        sh = img.width / targetRatio;
        sy = (img.height - sh) / 2;
      }

      // Draw cropped + resized
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, TARGET_WIDTH, TARGET_HEIGHT);

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Failed to create blob"));
        },
        "image/jpeg",
        0.85
      );
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
}

export function CoverImageUpload({
  value,
  onChange,
  className,
}: CoverImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string>(value || "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate
      if (!file.type.startsWith("image/")) {
        alert("กรุณาเลือกไฟล์รูปภาพ");
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        alert("ไฟล์ใหญ่เกิน 10MB");
        return;
      }

      setIsUploading(true);
      try {
        // Resize + crop to 900x506
        const blob = await resizeAndCrop(file);

        // Upload
        const formData = new FormData();
        formData.append("file", blob, `cover-${Date.now()}.jpg`);
        formData.append("type", "news-cover");

        const res = await fetch("/api/v1/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          // Fallback: save as local data URL if upload API doesn't exist
          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = reader.result as string;
            setPreview(dataUrl);
            onChange(dataUrl);
          };
          reader.readAsDataURL(blob);
          return;
        }

        const json = await res.json();
        if (json.success && json.data?.url) {
          setPreview(json.data.url);
          onChange(json.data.url);
        }
      } catch {
        // Fallback: use local blob URL for preview
        const blob = await resizeAndCrop(file);
        const url = URL.createObjectURL(blob);
        setPreview(url);

        // Save as base64 for now (until S3/upload is configured)
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result as string;
          onChange(base64);
        };
        reader.readAsDataURL(blob);
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [onChange]
  );

  const handleRemove = () => {
    setPreview("");
    onChange("");
  };

  return (
    <div className={cn("space-y-2", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      {preview ? (
        <div className="relative group">
          <img
            src={preview}
            alt="Cover"
            className="w-full rounded-lg border object-cover"
            style={{ aspectRatio: "16/9" }}
          />
          <div className="absolute inset-0 flex items-center justify-center gap-2 rounded-lg bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <Crop className="h-4 w-4 mr-1" />
              เปลี่ยนรูป
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleRemove}
            >
              <X className="h-4 w-4 mr-1" />
              ลบ
            </Button>
          </div>
          <div className="absolute bottom-2 right-2 rounded bg-black/60 px-2 py-0.5 text-xs text-white">
            {TARGET_WIDTH}×{TARGET_HEIGHT}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 py-8 text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
          style={{ aspectRatio: "16/9" }}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="text-sm">กำลังประมวลผล...</span>
            </>
          ) : (
            <>
              <Upload className="h-8 w-8" />
              <span className="text-sm font-medium">อัปโหลดรูปปก</span>
              <span className="text-xs">
                รูปจะถูก Resize + Crop เป็น {TARGET_WIDTH}×{TARGET_HEIGHT} (16:9) อัตโนมัติ
              </span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
