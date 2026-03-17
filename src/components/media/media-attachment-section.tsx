"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  ImageIcon,
  Video,
  Music,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { MediaUploader } from "./media-uploader";
import type { MediaFileResponse } from "./media-uploader";
import { VideoEmbedInput } from "./video-embed-input";
import { MediaViewerDialog } from "./media-viewer-dialog";
import type { ViewerMedia } from "./media-viewer-dialog";
import { formatDuration } from "@/lib/media-utils";
import {
  MAX_IMAGES_PER_QUESTION,
  MAX_VIDEOS_PER_QUESTION,
  MAX_AUDIOS_PER_QUESTION,
} from "@/lib/validations/media";

// ============================================================
// Types
// ============================================================

export interface MediaItemData {
  mediaFileId: string;
  url: string;
  thumbnailUrl?: string | null;
  type: "IMAGE" | "AUDIO" | "VIDEO";
  filename: string;
  mimeType: string;
  caption: string;
  sortOrder: number;
  duration?: number | null;
  provider?: string | null;
  externalId?: string | null;
}

interface MediaAttachmentSectionProps {
  media: MediaItemData[];
  onMediaChange: (media: MediaItemData[]) => void;
}

type TabType = "images" | "videos" | "audios";

// ============================================================
// Component
// ============================================================

export function MediaAttachmentSection({
  media,
  onMediaChange,
}: MediaAttachmentSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("images");
  const [viewerMedia, setViewerMedia] = useState<ViewerMedia | null>(null);

  const images = media.filter((m) => m.type === "IMAGE");
  const videos = media.filter((m) => m.type === "VIDEO");
  const audios = media.filter((m) => m.type === "AUDIO");
  const totalCount = media.length;

  // ── Handlers ──

  const addMedia = (response: MediaFileResponse) => {
    const newItem: MediaItemData = {
      mediaFileId: response.id,
      url: response.url,
      thumbnailUrl: response.thumbnailUrl,
      type: response.type as "IMAGE" | "AUDIO" | "VIDEO",
      filename: response.filename,
      mimeType: response.mimeType,
      caption: "",
      sortOrder: media.length,
      duration: response.duration,
      provider: response.provider,
      externalId: response.externalId,
    };
    onMediaChange([...media, newItem]);
  };

  const removeMedia = (mediaFileId: string) => {
    onMediaChange(
      media
        .filter((m) => m.mediaFileId !== mediaFileId)
        .map((m, idx) => ({ ...m, sortOrder: idx }))
    );
  };

  const updateCaption = (mediaFileId: string, caption: string) => {
    onMediaChange(
      media.map((m) =>
        m.mediaFileId === mediaFileId ? { ...m, caption } : m
      )
    );
  };

  const openViewer = (item: MediaItemData) => {
    setViewerMedia({
      url: item.url,
      thumbnailUrl: item.thumbnailUrl,
      type: item.type,
      filename: item.filename,
      caption: item.caption,
      duration: item.duration,
      provider: item.provider,
      externalId: item.externalId,
    });
  };

  // ── Tab config ──
  const tabs: { key: TabType; label: string; icon: typeof ImageIcon; count: number }[] = [
    { key: "images", label: "รูปภาพ", icon: ImageIcon, count: images.length },
    { key: "videos", label: "วิดีโอ", icon: Video, count: videos.length },
    { key: "audios", label: "เสียง", icon: Music, count: audios.length },
  ];

  return (
    <Card>
      <CardContent className="pt-6">
        {/* Header (collapsible) */}
        <button
          type="button"
          className="flex w-full items-center justify-between text-sm font-semibold"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span>
            สื่อประกอบ{" "}
            <span className="font-normal text-muted-foreground">
              (ไม่บังคับ)
            </span>
            {totalCount > 0 && (
              <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/10 px-1.5 text-xs font-medium text-primary">
                {totalCount}
              </span>
            )}
          </span>
          {isOpen ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {/* Content */}
        {isOpen && (
          <div className="mt-4 space-y-4">
            {/* Tabs */}
            <div className="flex gap-1 rounded-lg bg-muted p-1">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    activeTab === tab.key
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  {tab.label}
                  {tab.count > 0 && (
                    <span className="rounded-full bg-primary/10 px-1.5 text-[10px] text-primary">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* ── Images Tab ── */}
            {activeTab === "images" && (
              <div className="space-y-3">
                {images.length < MAX_IMAGES_PER_QUESTION && (
                  <MediaUploader accept="image" onUpload={addMedia} />
                )}
                {images.length > 0 && (
                  <div className="space-y-2">
                    {images.map((img) => (
                      <div
                        key={img.mediaFileId}
                        className="flex items-center gap-3 rounded-lg border p-2"
                      >
                        {/* Thumbnail */}
                        <button
                          type="button"
                          className="shrink-0 overflow-hidden rounded-md"
                          onClick={() => openViewer(img)}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={img.thumbnailUrl || img.url}
                            alt={img.caption || img.filename}
                            className="h-16 w-16 object-cover hover:opacity-80 transition-opacity"
                          />
                        </button>
                        {/* Caption */}
                        <Input
                          placeholder="คำบรรยาย (ไม่บังคับ)"
                          value={img.caption}
                          onChange={(e) =>
                            updateCaption(img.mediaFileId, e.target.value)
                          }
                          className="flex-1 text-sm h-8"
                        />
                        {/* Delete */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() => removeMedia(img.mediaFileId)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                {images.length >= MAX_IMAGES_PER_QUESTION && (
                  <p className="text-xs text-muted-foreground">
                    เพิ่มรูปภาพได้สูงสุด {MAX_IMAGES_PER_QUESTION} รูป
                  </p>
                )}
              </div>
            )}

            {/* ── Videos Tab ── */}
            {activeTab === "videos" && (
              <div className="space-y-3">
                {videos.length < MAX_VIDEOS_PER_QUESTION && (
                  <VideoEmbedInput onVideoAdd={addMedia} />
                )}
                {videos.length > 0 && (
                  <div className="space-y-2">
                    {videos.map((vid) => (
                      <div
                        key={vid.mediaFileId}
                        className="flex items-center gap-3 rounded-lg border p-3"
                      >
                        {/* Video icon */}
                        <button
                          type="button"
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted hover:bg-muted/80 transition-colors"
                          onClick={() => openViewer(vid)}
                        >
                          <Video
                            className={`h-5 w-5 ${
                              vid.provider === "youtube"
                                ? "text-red-600"
                                : "text-blue-600"
                            }`}
                          />
                        </button>
                        {/* Info */}
                        <div className="flex flex-1 flex-col gap-1">
                          <span className="text-xs font-medium">
                            {vid.provider === "youtube"
                              ? "YouTube"
                              : vid.provider === "vimeo"
                                ? "Vimeo"
                                : "Video"}
                          </span>
                          <Input
                            placeholder="คำบรรยาย (ไม่บังคับ)"
                            value={vid.caption}
                            onChange={(e) =>
                              updateCaption(vid.mediaFileId, e.target.value)
                            }
                            className="text-sm h-7"
                          />
                        </div>
                        {/* Delete */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() => removeMedia(vid.mediaFileId)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                {videos.length >= MAX_VIDEOS_PER_QUESTION && (
                  <p className="text-xs text-muted-foreground">
                    เพิ่มวิดีโอได้สูงสุด {MAX_VIDEOS_PER_QUESTION} รายการ
                  </p>
                )}
              </div>
            )}

            {/* ── Audios Tab ── */}
            {activeTab === "audios" && (
              <div className="space-y-3">
                {audios.length < MAX_AUDIOS_PER_QUESTION && (
                  <MediaUploader accept="audio" onUpload={addMedia} />
                )}
                {audios.length > 0 && (
                  <div className="space-y-2">
                    {audios.map((aud) => (
                      <div
                        key={aud.mediaFileId}
                        className="flex items-center gap-3 rounded-lg border p-3"
                      >
                        {/* Audio icon */}
                        <button
                          type="button"
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted hover:bg-muted/80 transition-colors"
                          onClick={() => openViewer(aud)}
                        >
                          <Music className="h-5 w-5 text-muted-foreground" />
                        </button>
                        {/* Info */}
                        <div className="flex flex-1 flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium truncate">
                              {aud.filename}
                            </span>
                            {aud.duration != null && (
                              <span className="text-[10px] text-muted-foreground">
                                {formatDuration(aud.duration)}
                              </span>
                            )}
                          </div>
                          <Input
                            placeholder="คำบรรยาย (ไม่บังคับ)"
                            value={aud.caption}
                            onChange={(e) =>
                              updateCaption(aud.mediaFileId, e.target.value)
                            }
                            className="text-sm h-7"
                          />
                        </div>
                        {/* Delete */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() => removeMedia(aud.mediaFileId)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                {audios.length >= MAX_AUDIOS_PER_QUESTION && (
                  <p className="text-xs text-muted-foreground">
                    เพิ่มเสียงได้สูงสุด {MAX_AUDIOS_PER_QUESTION} รายการ
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Viewer Dialog */}
        {viewerMedia && (
          <MediaViewerDialog
            open={!!viewerMedia}
            onOpenChange={(open) => !open && setViewerMedia(null)}
            media={viewerMedia}
            allImages={
              viewerMedia.type === "IMAGE"
                ? images.map((img) => ({
                    url: img.url,
                    thumbnailUrl: img.thumbnailUrl,
                    type: img.type,
                    filename: img.filename,
                    caption: img.caption,
                  }))
                : undefined
            }
          />
        )}
      </CardContent>
    </Card>
  );
}
