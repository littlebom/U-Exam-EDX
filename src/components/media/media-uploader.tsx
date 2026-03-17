"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, Loader2, AlertCircle, ImageIcon, Music } from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================
// Types
// ============================================================

interface MediaUploaderProps {
  accept: "image" | "audio";
  onUpload: (mediaFile: MediaFileResponse) => void;
  disabled?: boolean;
}

export interface MediaFileResponse {
  id: string;
  url: string;
  thumbnailUrl: string | null;
  type: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  width: number | null;
  height: number | null;
  duration: number | null;
  provider: string | null;
  externalId: string | null;
}

type UploadState = "idle" | "uploading" | "error";

// ============================================================
// Component
// ============================================================

export function MediaUploader({
  accept,
  onUpload,
  disabled = false,
}: MediaUploaderProps) {
  const [state, setState] = useState<UploadState>("idle");
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptMime =
    accept === "image"
      ? "image/jpeg,image/png,image/webp,image/gif"
      : "audio/mpeg,audio/wav,audio/ogg,audio/mp4,audio/x-m4a";
  const maxSizeMB = accept === "image" ? 10 : 20;
  const Icon = accept === "image" ? ImageIcon : Music;
  const label =
    accept === "image"
      ? "ลากรูปภาพมาวาง หรือ คลิกเลือก"
      : "ลากไฟล์เสียงมาวาง หรือ คลิกเลือก";

  const uploadFile = useCallback(
    async (file: File) => {
      setError("");
      setState("uploading");

      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/v1/upload", {
          method: "POST",
          body: formData,
        });

        const json = await res.json();

        if (!json.success) {
          throw new Error(json.error || "อัปโหลดไม่สำเร็จ");
        }

        setState("idle");
        onUpload(json.data as MediaFileResponse);
      } catch (err) {
        setState("error");
        setError(
          err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการอัปโหลด"
        );
      }
    },
    [onUpload]
  );

  const handleFileSelect = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const file = files[0];

      // Client-side validation
      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`ไฟล์มีขนาดใหญ่เกินไป (สูงสุด ${maxSizeMB}MB)`);
        setState("error");
        return;
      }

      uploadFile(file);
    },
    [maxSizeMB, uploadFile]
  );

  // ── Drag & Drop handlers ──
  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) setIsDragging(true);
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;
      handleFileSelect(e.dataTransfer.files);
    },
    [disabled, handleFileSelect]
  );

  const handleClick = () => {
    if (disabled || state === "uploading") return;
    fileInputRef.current?.click();
  };

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={(e) => e.key === "Enter" && handleClick()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30",
          disabled && "cursor-not-allowed opacity-50",
          state === "uploading" && "pointer-events-none opacity-70"
        )}
      >
        {state === "uploading" ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">
              กำลังอัปโหลด...
            </span>
          </>
        ) : (
          <>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <Icon className="h-5 w-5 text-muted-foreground" />
            </div>
            <span className="text-sm text-muted-foreground">{label}</span>
            <span className="text-xs text-muted-foreground/70">
              สูงสุด {maxSizeMB}MB
            </span>
          </>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptMime}
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files)}
      />

      {/* Error message */}
      {state === "error" && error && (
        <div className="mt-2 flex items-center gap-1.5 text-sm text-destructive">
          <AlertCircle className="h-3.5 w-3.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
