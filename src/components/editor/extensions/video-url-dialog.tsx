"use client";

import { useState } from "react";
import { Plus, Loader2, Video, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { parseVideoUrl } from "@/lib/media-utils";

interface VideoUrlDialogProps {
  onInsert: (attrs: {
    mediaFileId: string;
    src: string;
    provider: string;
    externalId: string;
  }) => void;
  disabled?: boolean;
  children: React.ReactNode;
}

export function VideoUrlDialog({ onInsert, disabled, children }: VideoUrlDialogProps) {
  const [open, setOpen] = useState(false);
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

      const data = json.data;
      onInsert({
        mediaFileId: data.id,
        src: data.url,
        provider: data.provider || parsed.provider,
        externalId: data.externalId || parsed.videoId,
      });

      setUrl("");
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Popover
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) {
          setUrl("");
          setError("");
        }
      }}
    >
      <PopoverTrigger asChild disabled={disabled}>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3" side="bottom" align="start">
        <p className="mb-2 text-xs font-medium text-muted-foreground">
          เพิ่มวิดีโอ YouTube / Vimeo
        </p>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Input
              placeholder="วาง URL..."
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setError("");
              }}
              disabled={isAdding}
              className="h-8 pr-20 text-sm"
            />
            {parsed && (
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium">
                {parsed.provider === "youtube" ? (
                  <span className="flex items-center gap-0.5 text-red-600">
                    <Video className="h-3 w-3" /> YT
                  </span>
                ) : (
                  <span className="flex items-center gap-0.5 text-blue-600">
                    <Video className="h-3 w-3" /> Vim
                  </span>
                )}
              </span>
            )}
          </div>
          <Button
            type="button"
            size="sm"
            className="h-8 gap-1 px-2"
            disabled={!isValid || isAdding}
            onClick={handleAdd}
          >
            {isAdding ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
        {error && (
          <div className="mt-1.5 flex items-center gap-1 text-xs text-destructive">
            <AlertCircle className="h-3 w-3" />
            <span>{error}</span>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
