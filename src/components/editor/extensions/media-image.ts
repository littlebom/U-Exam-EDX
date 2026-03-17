import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { MediaImageNodeView } from "./media-image-node-view";

/**
 * MediaImage — Block-level image node for Tiptap.
 *
 * Stores mediaFileId for DB referential integrity.
 * Toolbar button uploads file → inserts this node with all attributes.
 */
export const MediaImage = Node.create({
  name: "mediaImage",
  group: "block",
  atom: true,
  draggable: true,

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
    return [
      "figure",
      mergeAttributes({
        "data-type": "media-image",
        "data-media-file-id": HTMLAttributes.mediaFileId || "",
        class: "media-figure media-image",
      }),
      [
        "img",
        {
          src: HTMLAttributes.src || "",
          alt: HTMLAttributes.alt || "",
          loading: "lazy",
          width: HTMLAttributes.width || undefined,
          height: HTMLAttributes.height || undefined,
        },
      ],
      [
        "figcaption",
        { "data-caption": "true" },
        HTMLAttributes.caption || "",
      ],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MediaImageNodeView);
  },

  addCommands() {
    return {
      insertMediaImage:
        (attrs) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs,
          });
        },
    };
  },
});

// Extend Tiptap Commands interface
declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    mediaImage: {
      insertMediaImage: (attrs: {
        mediaFileId: string;
        src: string;
        thumbnailSrc?: string | null;
        alt?: string;
        caption?: string;
        width?: number | null;
        height?: number | null;
      }) => ReturnType;
    };
  }
}
