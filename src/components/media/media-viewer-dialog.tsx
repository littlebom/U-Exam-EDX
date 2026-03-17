"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { parseVideoUrl, formatDuration } from "@/lib/media-utils";

// ============================================================
// Types
// ============================================================

export interface ViewerMedia {
  url: string;
  thumbnailUrl?: string | null;
  type: "IMAGE" | "AUDIO" | "VIDEO";
  filename: string;
  caption?: string;
  duration?: number | null;
  provider?: string | null;
  externalId?: string | null;
}

interface MediaViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  media: ViewerMedia;
  /** All images for navigation (only used when type === IMAGE) */
  allImages?: ViewerMedia[];
}

// ============================================================
// Component
// ============================================================

export function MediaViewerDialog({
  open,
  onOpenChange,
  media,
  allImages,
}: MediaViewerDialogProps) {
  const [currentIndex, setCurrentIndex] = useState(() => {
    if (allImages && media.type === "IMAGE") {
      return allImages.findIndex((img) => img.url === media.url) || 0;
    }
    return 0;
  });

  const currentMedia =
    media.type === "IMAGE" && allImages
      ? allImages[currentIndex] || media
      : media;

  const canNavigate = media.type === "IMAGE" && allImages && allImages.length > 1;

  const goNext = () => {
    if (allImages) {
      setCurrentIndex((prev) => (prev + 1) % allImages.length);
    }
  };

  const goPrev = () => {
    if (allImages) {
      setCurrentIndex(
        (prev) => (prev - 1 + allImages.length) % allImages.length
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 gap-0 overflow-hidden">
        <DialogTitle className="sr-only">
          {currentMedia.type === "IMAGE"
            ? "รูปภาพ"
            : currentMedia.type === "VIDEO"
              ? "วิดีโอ"
              : "เสียง"}
        </DialogTitle>

        {/* ── Image Viewer ── */}
        {currentMedia.type === "IMAGE" && (
          <div className="relative">
            {/* Navigation */}
            {canNavigate && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 text-white hover:bg-black/70"
                  onClick={goPrev}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 text-white hover:bg-black/70"
                  onClick={goNext}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
                <div className="absolute top-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs text-white">
                  {currentIndex + 1} / {allImages!.length}
                </div>
              </>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentMedia.url}
              alt={currentMedia.caption || currentMedia.filename}
              className="max-h-[70vh] w-full object-contain bg-black/5"
            />
          </div>
        )}

        {/* ── Video Viewer ── */}
        {currentMedia.type === "VIDEO" && (() => {
          const parsed = parseVideoUrl(currentMedia.url);
          const embedUrl = parsed?.embedUrl || currentMedia.url;
          return (
            <div className="aspect-video w-full">
              <iframe
                src={embedUrl}
                title={currentMedia.caption || currentMedia.filename}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          );
        })()}

        {/* ── Audio Viewer ── */}
        {currentMedia.type === "AUDIO" && (
          <div className="flex flex-col items-center gap-4 p-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <span className="text-2xl">🔊</span>
            </div>
            <p className="text-sm font-medium">{currentMedia.filename}</p>
            {currentMedia.duration != null && (
              <p className="text-xs text-muted-foreground">
                {formatDuration(currentMedia.duration)}
              </p>
            )}
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <audio controls className="w-full max-w-md" src={currentMedia.url}>
              เบราว์เซอร์ของคุณไม่รองรับการเล่นเสียง
            </audio>
          </div>
        )}

        {/* Caption */}
        {currentMedia.caption && (
          <div className="border-t px-6 py-3">
            <p className="text-sm text-muted-foreground">
              {currentMedia.caption}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
