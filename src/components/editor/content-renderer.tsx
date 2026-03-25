"use client";

import { useEffect, useMemo, useRef } from "react";
import { generateHTML } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";
import UnderlineExt from "@tiptap/extension-underline";
import { Node, mergeAttributes } from "@tiptap/core";
import katex from "katex";
import DOMPurify from "isomorphic-dompurify";
import { legacyToTiptap } from "@/lib/content-utils";
import { cn } from "@/lib/utils";

// ============================================================
// Static Math Extensions (for generateHTML — no NodeView needed)
// ============================================================

const MathInlineStatic = Node.create({
  name: "mathInline",
  group: "inline",
  inline: true,
  atom: true,

  addAttributes() {
    return {
      latex: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-latex") || "",
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-type="math-inline"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes({
        "data-type": "math-inline",
        "data-latex": HTMLAttributes.latex || "",
        class: "math-render-target",
      }),
    ];
  },
});

const MathBlockStatic = Node.create({
  name: "mathBlock",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      latex: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-latex") || "",
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="math-block"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes({
        "data-type": "math-block",
        "data-latex": HTMLAttributes.latex || "",
        class: "math-render-target math-block-display",
      }),
    ];
  },
});

// ============================================================
// Static Media Extensions (for generateHTML — no NodeView needed)
// ============================================================

const MediaImageStatic = Node.create({
  name: "mediaImage",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      mediaFileId: { default: null },
      src: { default: "" },
      thumbnailSrc: { default: null },
      alt: { default: "" },
      caption: { default: "" },
      width: { default: null },
      height: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'figure[data-type="media-image"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    const caption = HTMLAttributes.caption || "";
    const children: unknown[] = [
      [
        "img",
        {
          src: HTMLAttributes.src || "",
          alt: HTMLAttributes.alt || "",
          loading: "lazy",
          style: "max-width:100%;height:auto;border-radius:0.5rem;",
        },
      ],
    ];
    if (caption) {
      children.push([
        "figcaption",
        { style: "text-align:center;font-size:0.875rem;color:#6b7280;margin-top:0.5rem;" },
        caption,
      ]);
    }
    return [
      "figure",
      mergeAttributes({
        "data-type": "media-image",
        class: "media-figure media-image",
        style: "margin:1rem 0;text-align:center;",
      }),
      ...children,
    ];
  },
});

const MediaAudioStatic = Node.create({
  name: "mediaAudio",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      mediaFileId: { default: null },
      src: { default: "" },
      filename: { default: "" },
      caption: { default: "" },
      duration: { default: null },
      mimeType: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: 'figure[data-type="media-audio"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    const caption = HTMLAttributes.caption || "";
    const children: unknown[] = [
      [
        "audio",
        {
          controls: "true",
          preload: "metadata",
          src: HTMLAttributes.src || "",
          style: "width:100%;",
        },
      ],
    ];
    if (caption) {
      children.push([
        "figcaption",
        { style: "text-align:center;font-size:0.875rem;color:#6b7280;margin-top:0.5rem;" },
        caption,
      ]);
    }
    return [
      "figure",
      mergeAttributes({
        "data-type": "media-audio",
        class: "media-figure media-audio",
        style: "margin:1rem 0;padding:1rem;border:1px solid #e5e7eb;border-radius:0.5rem;",
      }),
      ...children,
    ];
  },
});

const MediaVideoStatic = Node.create({
  name: "mediaVideo",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      mediaFileId: { default: null },
      src: { default: "" },
      caption: { default: "" },
      provider: { default: null },
      externalId: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'figure[data-type="media-video"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    const caption = HTMLAttributes.caption || "";
    return [
      "figure",
      mergeAttributes({
        "data-type": "media-video",
        "data-provider": HTMLAttributes.provider || "",
        "data-external-id": HTMLAttributes.externalId || "",
        class: "media-figure media-video",
        style: "margin:1rem 0;",
      }),
      ...(caption
        ? [
            [
              "figcaption",
              { style: "text-align:center;font-size:0.875rem;color:#6b7280;margin-top:0.5rem;" },
              caption,
            ],
          ]
        : []),
    ];
  },
});

// ============================================================
// Extensions list for generateHTML
// ============================================================

const extensions = [
  StarterKit.configure({ heading: { levels: [2, 3, 4] } }),
  UnderlineExt,
  MathInlineStatic,
  MathBlockStatic,
  MediaImageStatic,
  MediaAudioStatic,
  MediaVideoStatic,
];

// ============================================================
// Component
// ============================================================

interface ContentRendererProps {
  content: unknown;
  className?: string;
}

/**
 * ContentRenderer — Renders Tiptap JSON content as rich HTML with KaTeX math.
 *
 * Handles both legacy `{ type: "text", text: "..." }` and Tiptap JSON formats.
 * KaTeX is rendered client-side via useEffect after HTML mount.
 */
export function ContentRenderer({ content, className }: ContentRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Convert content to HTML
  const html = useMemo(() => {
    try {
      const tiptapContent = legacyToTiptap(content);
      return generateHTML(tiptapContent, extensions);
    } catch {
      // Fallback: render as plain text
      if (typeof content === "string") return content;
      if (
        typeof content === "object" &&
        content !== null &&
        "text" in content
      ) {
        return String((content as Record<string, unknown>).text ?? "");
      }
      return "";
    }
  }, [content]);

  // Render KaTeX for math nodes after DOM mount
  useEffect(() => {
    if (!containerRef.current) return;

    // Inline math
    containerRef.current
      .querySelectorAll<HTMLElement>('[data-type="math-inline"]')
      .forEach((el) => {
        const latex = el.getAttribute("data-latex") || "";
        if (latex) {
          katex.render(latex, el, {
            throwOnError: false,
            displayMode: false,
          });
        }
      });

    // Block math
    containerRef.current
      .querySelectorAll<HTMLElement>('[data-type="math-block"]')
      .forEach((el) => {
        const latex = el.getAttribute("data-latex") || "";
        if (latex) {
          katex.render(latex, el, {
            throwOnError: false,
            displayMode: true,
          });
        }
      });

    // Video embeds — inject iframe
    containerRef.current
      .querySelectorAll<HTMLElement>('[data-type="media-video"]')
      .forEach((el) => {
        // Skip if already has an iframe
        if (el.querySelector("iframe")) return;

        const provider = el.getAttribute("data-provider") || "";
        const externalId = el.getAttribute("data-external-id") || "";
        if (!provider || !externalId) return;

        let embedUrl = "";
        if (provider === "youtube") {
          embedUrl = `https://www.youtube.com/embed/${externalId}`;
        } else if (provider === "vimeo") {
          embedUrl = `https://player.vimeo.com/video/${externalId}`;
        }
        if (!embedUrl) return;

        const wrapper = document.createElement("div");
        wrapper.style.cssText =
          "position:relative;width:100%;padding-bottom:56.25%;border-radius:0.5rem;overflow:hidden;";
        const iframe = document.createElement("iframe");
        iframe.src = embedUrl;
        iframe.title = `${provider} video`;
        iframe.allow =
          "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
        iframe.allowFullscreen = true;
        iframe.style.cssText =
          "position:absolute;top:0;left:0;width:100%;height:100%;border:0;";
        wrapper.appendChild(iframe);

        // Insert before figcaption if present
        const figcaption = el.querySelector("figcaption");
        if (figcaption) {
          el.insertBefore(wrapper, figcaption);
        } else {
          el.appendChild(wrapper);
        }
      });
  }, [html]);

  if (!html) return null;

  return (
    <div
      ref={containerRef}
      className={cn("prose-content", className)}
      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }}
    />
  );
}
