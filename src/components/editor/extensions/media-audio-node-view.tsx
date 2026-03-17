"use client";

import { useCallback, useState } from "react";
import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { Music, Trash2 } from "lucide-react";
import { formatDuration } from "@/lib/media-utils";

/**
 * MediaAudioNodeView — React NodeView for mediaAudio node.
 *
 * Shows an audio player card with filename, duration, and native audio controls.
 */
export function MediaAudioNodeView({
  node,
  updateAttributes,
  deleteNode,
  selected,
}: NodeViewProps) {
  const src = (node.attrs.src as string) || "";
  const filename = (node.attrs.filename as string) || "Audio";
  const caption = (node.attrs.caption as string) || "";
  const duration = node.attrs.duration as number | null;

  const [captionValue, setCaptionValue] = useState(caption);

  const handleCaptionBlur = useCallback(() => {
    if (captionValue !== caption) {
      updateAttributes({ caption: captionValue });
    }
  }, [captionValue, caption, updateAttributes]);

  return (
    <NodeViewWrapper className={`media-node media-audio-node ${selected ? "selected" : ""}`}>
      <figure className="group/media relative my-2 rounded-lg border bg-muted/30">
        {/* Delete button */}
        <button
          type="button"
          className="absolute right-2 top-2 z-10 hidden rounded-md bg-destructive p-1.5 text-destructive-foreground shadow-sm transition-colors hover:bg-destructive/90 group-hover/media:flex"
          onClick={deleteNode}
          title="ลบเสียง"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>

        {/* Audio card */}
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
            <Music className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{filename}</p>
            {duration != null && (
              <p className="text-xs text-muted-foreground">
                {formatDuration(duration)}
              </p>
            )}
          </div>
        </div>

        {/* Native audio player */}
        {src && (
          <div className="px-4 pb-3">
            <audio controls preload="metadata" className="w-full" src={src}>
              เบราว์เซอร์ไม่รองรับการเล่นเสียง
            </audio>
          </div>
        )}

        {/* Caption */}
        <div className="border-t bg-card/50 px-3 py-2">
          <input
            type="text"
            value={captionValue}
            onChange={(e) => setCaptionValue(e.target.value)}
            onBlur={handleCaptionBlur}
            placeholder="คำอธิบายเสียง (ไม่บังคับ)"
            className="w-full bg-transparent text-center text-sm text-muted-foreground outline-none placeholder:text-muted-foreground/50"
          />
        </div>
      </figure>
    </NodeViewWrapper>
  );
}
