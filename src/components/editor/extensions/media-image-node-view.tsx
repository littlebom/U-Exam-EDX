"use client";

import { useCallback, useState } from "react";
import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { Trash2, ImageIcon } from "lucide-react";

/**
 * MediaImageNodeView — React NodeView for mediaImage node.
 *
 * Displays image thumbnail with optional caption.
 * Click to select, hover to show delete button.
 */
export function MediaImageNodeView({
  node,
  updateAttributes,
  deleteNode,
  selected,
}: NodeViewProps) {
  const src = (node.attrs.src as string) || "";
  const thumbnailSrc = (node.attrs.thumbnailSrc as string) || "";
  const alt = (node.attrs.alt as string) || "";
  const caption = (node.attrs.caption as string) || "";

  const [captionValue, setCaptionValue] = useState(caption);

  const handleCaptionBlur = useCallback(() => {
    if (captionValue !== caption) {
      updateAttributes({ caption: captionValue });
    }
  }, [captionValue, caption, updateAttributes]);

  const displaySrc = thumbnailSrc || src;

  return (
    <NodeViewWrapper className={`media-node media-image-node ${selected ? "selected" : ""}`}>
      <figure className="group/media relative my-2 overflow-hidden rounded-lg border bg-muted/30">
        {/* Delete button */}
        <button
          type="button"
          className="absolute right-2 top-2 z-10 hidden rounded-md bg-destructive p-1.5 text-destructive-foreground shadow-sm transition-colors hover:bg-destructive/90 group-hover/media:flex"
          onClick={deleteNode}
          title="ลบรูปภาพ"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>

        {/* Image */}
        {displaySrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={displaySrc}
            alt={alt}
            className="mx-auto max-h-96 w-auto object-contain"
            loading="lazy"
          />
        ) : (
          <div className="flex h-32 items-center justify-center text-muted-foreground">
            <ImageIcon className="h-8 w-8" />
          </div>
        )}

        {/* Caption */}
        <div className="border-t bg-card/50 px-3 py-2">
          <input
            type="text"
            value={captionValue}
            onChange={(e) => setCaptionValue(e.target.value)}
            onBlur={handleCaptionBlur}
            placeholder="คำอธิบายรูปภาพ (ไม่บังคับ)"
            className="w-full bg-transparent text-center text-sm text-muted-foreground outline-none placeholder:text-muted-foreground/50"
          />
        </div>
      </figure>
    </NodeViewWrapper>
  );
}
