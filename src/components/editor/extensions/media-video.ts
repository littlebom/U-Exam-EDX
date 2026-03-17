import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { MediaVideoNodeView } from "./media-video-node-view";

/**
 * MediaVideo — Block-level video embed node for Tiptap.
 *
 * Supports YouTube and Vimeo embeds.
 * Stores mediaFileId for DB referential integrity.
 */
export const MediaVideo = Node.create({
  name: "mediaVideo",
  group: "block",
  atom: true,
  draggable: true,

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
    return [
      "figure",
      mergeAttributes({
        "data-type": "media-video",
        "data-media-file-id": HTMLAttributes.mediaFileId || "",
        "data-provider": HTMLAttributes.provider || "",
        "data-external-id": HTMLAttributes.externalId || "",
        "data-src": HTMLAttributes.src || "",
        class: "media-figure media-video",
      }),
      [
        "figcaption",
        { "data-caption": "true" },
        HTMLAttributes.caption || "",
      ],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MediaVideoNodeView);
  },

  addCommands() {
    return {
      insertMediaVideo:
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

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    mediaVideo: {
      insertMediaVideo: (attrs: {
        mediaFileId: string;
        src: string;
        caption?: string;
        provider: string;
        externalId: string;
      }) => ReturnType;
    };
  }
}
