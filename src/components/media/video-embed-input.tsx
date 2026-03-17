"use client";

import { useState } from "react";
import { Plus, AlertCircle, Loader2, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { parseVideoUrl } from "@/lib/media-utils";
import type { MediaFileResponse } from "./media-uploader";

// ============================================================
// Types
// ============================================================

interface VideoEmbedInputProps {
  onVideoAdd: (mediaFile: MediaFileResponse) => void;
  disabled?: boolean;
}

// ============================================================
// Component
// ============================================================

export function VideoEmbedInput({
  onVideoAdd,
  disabled = false,
}: VideoEmbedInputProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const parsed = url.trim() ? parseVideoUrl(url.trim()) : null;
  const isValid = parsed !== null;

  const handleAdd = async () => {
    if (!isValid || !parsed) return;

    setIsAdding(true);
    setError("");

    try {
      const res = await fetch("/api/v1/upload/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error || "ไม่สามารถเพิ่มวิดีโอได้");
      }

      onVideoAdd(json.data as MediaFileResponse);
      setUrl("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "เกิดข้อผิดพลาด"
      );
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Input
            placeholder="วาง URL YouTube หรือ Vimeo..."
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setError("");
            }}
            disabled={disabled || isAdding}
            className="pr-24"
          />
          {/* Provider badge */}
          {parsed && (
            <span className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
              {parsed.provider === "youtube" ? (
                <span className="flex items-center gap-1 text-red-600">
                  <Video className="h-3 w-3" /> YouTube
                </span>
              ) : (
                <span className="flex items-center gap-1 text-blue-600">
                  <Video className="h-3 w-3" /> Vimeo
                </span>
              )}
            </span>
          )}
        </div>
        <Button
          type="button"
          size="sm"
          className="gap-1.5"
          disabled={!isValid || disabled || isAdding}
          onClick={handleAdd}
        >
          {isAdding ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Plus className="h-3.5 w-3.5" />
          )}
          เพิ่ม
        </Button>
      </div>

      {/* Error / Hint */}
      {url.trim() && !isValid && !error && (
        <p className="text-xs text-muted-foreground">
          รองรับ YouTube (youtube.com/watch?v=..., youtu.be/...) และ Vimeo
          (vimeo.com/...)
        </p>
      )}
      {error && (
        <div className="flex items-center gap-1.5 text-sm text-destructive">
          <AlertCircle className="h-3.5 w-3.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
