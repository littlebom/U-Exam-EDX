"use client";

import { useCallback, useState } from "react";
import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { Trash2, Video } from "lucide-react";

/**
 * MediaVideoNodeView — React NodeView for mediaVideo node.
 *
 * Shows a video embed (YouTube/Vimeo iframe) with optional caption.
 */
export function MediaVideoNodeView({
  node,
  updateAttributes,
  deleteNode,
  selected,
}: NodeViewProps) {
  const caption = (node.attrs.caption as string) || "";
  const provider = (node.attrs.provider as string) || "";
  const externalId = (node.attrs.externalId as string) || "";

  const [captionValue, setCaptionValue] = useState(caption);

  const handleCaptionBlur = useCallback(() => {
    if (captionValue !== caption) {
      updateAttributes({ caption: captionValue });
    }
  }, [captionValue, caption, updateAttributes]);

  // Build embed URL
  let embedUrl = "";
  if (provider === "youtube" && externalId) {
    embedUrl = `https://www.youtube.com/embed/${externalId}`;
  } else if (provider === "vimeo" && externalId) {
    embedUrl = `https://player.vimeo.com/video/${externalId}`;
  }

  return (
    <NodeViewWrapper className={`media-node media-video-node ${selected ? "selected" : ""}`}>
      <figure className="group/media relative my-2 overflow-hidden rounded-lg border bg-muted/30">
        {/* Delete button */}
        <button
          type="button"
          className="absolute right-2 top-2 z-10 hidden rounded-md bg-destructive p-1.5 text-destructive-foreground shadow-sm transition-colors hover:bg-destructive/90 group-hover/media:flex"
          onClick={deleteNode}
          title="ลบวิดีโอ"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>

        {/* Video embed */}
        {embedUrl ? (
          <div className="relative aspect-video w-full">
            <iframe
              src={embedUrl}
              title={`${provider} video`}
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="flex h-32 items-center justify-center gap-2 text-muted-foreground">
            <Video className="h-8 w-8" />
            <span className="text-sm">ไม่สามารถแสดงวิดีโอได้</span>
          </div>
        )}

        {/* Provider badge */}
        {provider && (
          <div className="absolute left-2 top-2 z-10">
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium text-white shadow-sm ${
                provider === "youtube" ? "bg-red-600" : "bg-blue-600"
              }`}
            >
              {provider === "youtube" ? "YouTube" : "Vimeo"}
            </span>
          </div>
        )}

        {/* Caption */}
        <div className="border-t bg-card/50 px-3 py-2">
          <input
            type="text"
            value={captionValue}
            onChange={(e) => setCaptionValue(e.target.value)}
            onBlur={handleCaptionBlur}
            placeholder="คำอธิบายวิดีโอ (ไม่บังคับ)"
            className="w-full bg-transparent text-center text-sm text-muted-foreground outline-none placeholder:text-muted-foreground/50"
          />
        </div>
      </figure>
    </NodeViewWrapper>
  );
}
