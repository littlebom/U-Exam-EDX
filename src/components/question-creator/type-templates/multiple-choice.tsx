"use client";

import { useState, useRef } from "react";
import {
  Plus,
  Trash2,
  Paperclip,
  ImageIcon,
  Video,
  Music,
  X,
  Loader2,
  Sigma,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { MediaViewerDialog } from "@/components/media/media-viewer-dialog";
import type { ViewerMedia } from "@/components/media/media-viewer-dialog";
import type { MediaFileResponse } from "@/components/media/media-uploader";
import { isValidVideoUrl } from "@/lib/media-utils";
import { OptionTextRenderer, hasMathContent } from "@/components/editor";
import {
  isAllowedImageType,
  isAllowedAudioType,
  MAX_IMAGE_SIZE,
  MAX_AUDIO_SIZE,
} from "@/lib/validations/media";

// ============================================================
// Types
// ============================================================

export interface MCOptionMedia {
  mediaFileId: string;
  url: string;
  thumbnailUrl?: string | null;
  type: "IMAGE" | "AUDIO" | "VIDEO";
  filename: string;
  mimeType: string;
  duration?: number | null;
  provider?: string | null;
  externalId?: string | null;
}

export interface MCOption {
  id: string;
  text: string;
  media?: MCOptionMedia | null;
}

// ============================================================
// Constants
// ============================================================

const LABELS = ["A", "B", "C", "D", "E", "F", "G", "H"];

// ============================================================
// Shared OptionsList component (used by MC + ImageBased)
// ============================================================

interface OptionsListProps {
  options: MCOption[];
  correctAnswerId: string;
  onOptionsChange: (options: MCOption[]) => void;
  onCorrectChange: (id: string) => void;
  idPrefix?: string;
}

export function OptionsList({
  options,
  correctAnswerId,
  onOptionsChange,
  onCorrectChange,
  idPrefix = "",
}: OptionsListProps) {
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [viewerMedia, setViewerMedia] = useState<ViewerMedia | null>(null);
  const [videoUrlInput, setVideoUrlInput] = useState("");
  const [videoError, setVideoError] = useState("");
  const [addingVideoId, setAddingVideoId] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const [activeOptionId, setActiveOptionId] = useState<string | null>(null);
  const optionInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // ── Option handlers ──

  const addOption = () => {
    const id = crypto.randomUUID().slice(0, 8);
    onOptionsChange([...options, { id, text: "" }]);
  };

  const removeOption = (id: string) => {
    if (options.length <= 2) return;
    onOptionsChange(options.filter((o) => o.id !== id));
    if (correctAnswerId === id) onCorrectChange("");
  };

  const updateText = (id: string, text: string) => {
    onOptionsChange(options.map((o) => (o.id === id ? { ...o, text } : o)));
  };

  const insertMath = (id: string) => {
    const input = optionInputRefs.current[id];
    if (!input) return;

    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? start;
    const before = input.value.slice(0, start);
    const after = input.value.slice(end);
    const newText = `${before}$$${after}`;

    updateText(id, newText);

    // Set cursor between the $ $
    requestAnimationFrame(() => {
      input.focus();
      input.setSelectionRange(start + 1, start + 1);
    });
  };

  // ── Media handlers ──

  const addMediaToOption = (optionId: string, mediaFile: MediaFileResponse) => {
    const media: MCOptionMedia = {
      mediaFileId: mediaFile.id,
      url: mediaFile.url,
      thumbnailUrl: mediaFile.thumbnailUrl,
      type: mediaFile.type as "IMAGE" | "AUDIO" | "VIDEO",
      filename: mediaFile.filename,
      mimeType: mediaFile.mimeType,
      duration: mediaFile.duration,
      provider: mediaFile.provider,
      externalId: mediaFile.externalId,
    };
    onOptionsChange(
      options.map((o) => (o.id === optionId ? { ...o, media } : o))
    );
  };

  const removeMediaFromOption = (optionId: string) => {
    onOptionsChange(
      options.map((o) =>
        o.id === optionId ? { ...o, media: undefined } : o
      )
    );
  };

  const handleFileUpload = async (
    optionId: string,
    file: File,
    category: "image" | "audio"
  ) => {
    if (category === "image") {
      if (!isAllowedImageType(file.type) || file.size > MAX_IMAGE_SIZE) return;
    } else {
      if (!isAllowedAudioType(file.type) || file.size > MAX_AUDIO_SIZE) return;
    }

    setUploadingId(optionId);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/v1/upload", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();

      if (json.success) {
        addMediaToOption(optionId, json.data as MediaFileResponse);
      }
    } catch {
      // silently fail
    } finally {
      setUploadingId(null);
    }
  };

  const handleVideoAdd = async (optionId: string) => {
    const url = videoUrlInput.trim();
    if (!url || !isValidVideoUrl(url)) {
      setVideoError("กรุณาระบุ URL YouTube หรือ Vimeo ที่ถูกต้อง");
      return;
    }

    setAddingVideoId(true);
    setVideoError("");

    try {
      const res = await fetch("/api/v1/upload/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const json = await res.json();

      if (json.success) {
        addMediaToOption(optionId, json.data as MediaFileResponse);
        setVideoUrlInput("");
        setActiveOptionId(null);
      } else {
        setVideoError(json.error || "ไม่สามารถเพิ่มวิดีโอได้");
      }
    } catch {
      setVideoError("เกิดข้อผิดพลาด");
    } finally {
      setAddingVideoId(false);
    }
  };

  const triggerImageUpload = (optionId: string) => {
    setActiveOptionId(optionId);
    setTimeout(() => imageInputRef.current?.click(), 0);
  };

  const triggerAudioUpload = (optionId: string) => {
    setActiveOptionId(optionId);
    setTimeout(() => audioInputRef.current?.click(), 0);
  };

  const openViewer = (media: MCOptionMedia) => {
    setViewerMedia({
      url: media.url,
      thumbnailUrl: media.thumbnailUrl,
      type: media.type,
      filename: media.filename,
      caption: "",
      duration: media.duration,
      provider: media.provider,
      externalId: media.externalId,
    });
  };

  // ── Render media slot for each option ──

  const renderMediaSlot = (opt: MCOption) => {
    const isUploading = uploadingId === opt.id;

    // Uploading state
    if (isUploading) {
      return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      );
    }

    // Has media — show thumbnail / icon
    if (opt.media) {
      const m = opt.media;
      return (
        <div className="group/media relative shrink-0">
          {m.type === "IMAGE" ? (
            <button
              type="button"
              className="overflow-hidden rounded-md"
              onClick={() => openViewer(m)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={m.thumbnailUrl || m.url}
                alt={m.filename}
                className="h-10 w-10 object-cover transition-opacity hover:opacity-80"
              />
            </button>
          ) : m.type === "VIDEO" ? (
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-md bg-muted transition-colors hover:bg-muted/80"
              onClick={() => openViewer(m)}
            >
              <Video
                className={`h-4 w-4 ${
                  m.provider === "youtube"
                    ? "text-red-600"
                    : "text-blue-600"
                }`}
              />
            </button>
          ) : (
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-md bg-muted transition-colors hover:bg-muted/80"
              onClick={() => openViewer(m)}
            >
              <Music className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
          {/* Remove button on hover */}
          <button
            type="button"
            className="absolute -right-1 -top-1 hidden h-4 w-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground group-hover/media:flex"
            onClick={(e) => {
              e.stopPropagation();
              removeMediaFromOption(opt.id);
            }}
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </div>
      );
    }

    // No media — show add button with popover
    return (
      <Popover
        onOpenChange={(open) => {
          if (!open) {
            setVideoUrlInput("");
            setVideoError("");
          }
        }}
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-dashed text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            title="เพิ่มสื่อประกอบ"
          >
            <Paperclip className="h-3.5 w-3.5" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2" side="bottom" align="start">
          <div className="space-y-1">
            <p className="px-2 py-1 text-xs font-medium text-muted-foreground">
              เพิ่มสื่อประกอบ
            </p>
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted"
              onClick={() => triggerImageUpload(opt.id)}
            >
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
              รูปภาพ
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted"
              onClick={() => triggerAudioUpload(opt.id)}
            >
              <Music className="h-4 w-4 text-muted-foreground" />
              เสียง
            </button>
            <div className="mt-1 border-t pt-1">
              <p className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground">
                <Video className="h-4 w-4" />
                วิดีโอ
              </p>
              <div className="flex gap-1 px-2 pb-1">
                <Input
                  placeholder="URL YouTube / Vimeo"
                  value={videoUrlInput}
                  onChange={(e) => {
                    setVideoUrlInput(e.target.value);
                    setVideoError("");
                  }}
                  className="h-7 text-xs"
                />
                <Button
                  type="button"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  disabled={
                    !videoUrlInput.trim() ||
                    !isValidVideoUrl(videoUrlInput.trim()) ||
                    addingVideoId
                  }
                  onClick={() => handleVideoAdd(opt.id)}
                >
                  {addingVideoId ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Plus className="h-3 w-3" />
                  )}
                </Button>
              </div>
              {videoError && (
                <p className="px-2 text-[10px] text-destructive">
                  {videoError}
                </p>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  };

  return (
    <div className="space-y-4">
      <Label className="text-sm font-semibold">
        ตัวเลือก{" "}
        <span className="font-normal text-muted-foreground">
          (คลิกวงกลมเพื่อเลือกคำตอบที่ถูกต้อง)
        </span>
      </Label>

      <RadioGroup value={correctAnswerId} onValueChange={onCorrectChange}>
        <div className="space-y-2">
          {options.map((opt, idx) => (
            <div key={opt.id} className="space-y-0">
              <div className="flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-muted/30">
                <RadioGroupItem
                  value={opt.id}
                  id={`${idPrefix}${opt.id}`}
                />
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-bold">
                  {LABELS[idx] ?? idx + 1}
                </span>

                {/* Media slot */}
                {renderMediaSlot(opt)}

                <Input
                  ref={(el) => { optionInputRefs.current[opt.id] = el; }}
                  placeholder={`ตัวเลือก ${LABELS[idx] ?? idx + 1}`}
                  value={opt.text}
                  onChange={(e) => updateText(opt.id, e.target.value)}
                  className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 text-muted-foreground hover:text-primary"
                  title="แทรกสูตรคณิตศาสตร์ ($...$)"
                  onClick={() => insertMath(opt.id)}
                >
                  <Sigma className="h-3.5 w-3.5" />
                </Button>
                {options.length > 2 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeOption(opt.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
              {/* KaTeX math preview */}
              {hasMathContent(opt.text) && (
                <div className="ml-[4.25rem] px-3 pb-2 pt-1">
                  <div className="rounded-md bg-muted/50 px-3 py-1.5 text-sm">
                    <OptionTextRenderer text={opt.text} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </RadioGroup>

      {options.length < 8 && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={addOption}
        >
          <Plus className="h-3.5 w-3.5" />
          เพิ่มตัวเลือก
        </Button>
      )}

      {/* Hidden file inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && activeOptionId) {
            handleFileUpload(activeOptionId, file, "image");
          }
          e.target.value = "";
        }}
      />
      <input
        ref={audioInputRef}
        type="file"
        accept="audio/mpeg,audio/wav,audio/ogg,audio/mp4,audio/x-m4a"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && activeOptionId) {
            handleFileUpload(activeOptionId, file, "audio");
          }
          e.target.value = "";
        }}
      />

      {/* Media Viewer Dialog */}
      {viewerMedia && (
        <MediaViewerDialog
          open={!!viewerMedia}
          onOpenChange={(open) => !open && setViewerMedia(null)}
          media={viewerMedia}
        />
      )}
    </div>
  );
}

// ============================================================
// Main MultipleChoiceTemplate (wraps OptionsList)
// ============================================================

interface MultipleChoiceProps {
  options: MCOption[];
  correctAnswerId: string;
  onOptionsChange: (options: MCOption[]) => void;
  onCorrectChange: (id: string) => void;
}

export function MultipleChoiceTemplate({
  options,
  correctAnswerId,
  onOptionsChange,
  onCorrectChange,
}: MultipleChoiceProps) {
  return (
    <OptionsList
      options={options}
      correctAnswerId={correctAnswerId}
      onOptionsChange={onOptionsChange}
      onCorrectChange={onCorrectChange}
    />
  );
}
