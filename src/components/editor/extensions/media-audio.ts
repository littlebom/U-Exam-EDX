import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { MediaAudioNodeView } from "./media-audio-node-view";

/**
 * MediaAudio — Block-level audio node for Tiptap.
 *
 * Stores mediaFileId for DB referential integrity.
 * Shows audio player card in editor.
 */
export const MediaAudio = Node.create({
  name: "mediaAudio",
  group: "block",
  atom: true,
  draggable: true,

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
    return [
      "figure",
      mergeAttributes({
        "data-type": "media-audio",
        "data-media-file-id": HTMLAttributes.mediaFileId || "",
        "data-filename": HTMLAttributes.filename || "",
        "data-duration": HTMLAttributes.duration ?? "",
        class: "media-figure media-audio",
      }),
      [
        "audio",
        {
          controls: "true",
          preload: "metadata",
          src: HTMLAttributes.src || "",
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
    return ReactNodeViewRenderer(MediaAudioNodeView);
  },

  addCommands() {
    return {
      insertMediaAudio:
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
    mediaAudio: {
      insertMediaAudio: (attrs: {
        mediaFileId: string;
        src: string;
        filename: string;
        caption?: string;
        duration?: number | null;
        mimeType?: string;
      }) => ReturnType;
    };
  }
}
