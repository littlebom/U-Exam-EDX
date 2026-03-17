import type { JSONContent } from "@tiptap/core";

const MEDIA_NODE_TYPES = new Set(["mediaImage", "mediaAudio", "mediaVideo"]);

interface MediaAttachment {
  mediaFileId: string;
  caption: string | null;
  sortOrder: number;
}

/**
 * Walk Tiptap JSON content recursively and extract all media node references.
 *
 * Returns an array of `{ mediaFileId, caption, sortOrder }` suitable for
 * creating QuestionMedia junction records on save.
 */
export function extractMediaFromContent(
  content: JSONContent | null | undefined
): MediaAttachment[] {
  if (!content) return [];

  const result: MediaAttachment[] = [];
  let order = 0;

  function walk(node: JSONContent) {
    if (node.type && MEDIA_NODE_TYPES.has(node.type) && node.attrs?.mediaFileId) {
      result.push({
        mediaFileId: node.attrs.mediaFileId as string,
        caption: (node.attrs.caption as string) || null,
        sortOrder: order++,
      });
    }

    if (node.content) {
      for (const child of node.content) {
        walk(child);
      }
    }
  }

  walk(content);
  return result;
}
