/**
 * Content Utility Library
 *
 * Centralized utilities for handling question content in both:
 * - Legacy format: { type: "text", text: "plain string" }
 * - Tiptap JSON format: { type: "doc", content: [...] }
 */

// ============================================================
// Types
// ============================================================

/** Tiptap-compatible JSON content node */
export interface TiptapNode {
  type: string;
  attrs?: Record<string, unknown>;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
  content?: TiptapNode[];
  text?: string;
}

/** Legacy content format used before Tiptap */
interface LegacyContent {
  type: "text";
  text: string;
}

// ============================================================
// Type Guards
// ============================================================

function isLegacyContent(content: unknown): content is LegacyContent {
  return (
    typeof content === "object" &&
    content !== null &&
    "type" in content &&
    (content as Record<string, unknown>).type === "text" &&
    "text" in content &&
    typeof (content as Record<string, unknown>).text === "string"
  );
}

function isTiptapDoc(content: unknown): content is TiptapNode {
  return (
    typeof content === "object" &&
    content !== null &&
    "type" in content &&
    (content as Record<string, unknown>).type === "doc" &&
    "content" in content &&
    Array.isArray((content as Record<string, unknown>).content)
  );
}

// ============================================================
// Conversion Functions
// ============================================================

/**
 * Convert any content format to Tiptap JSONContent.
 *
 * Handles:
 * - Tiptap JSON (pass through)
 * - Legacy `{ type: "text", text: "..." }`
 * - Plain string
 * - null/undefined → empty doc
 */
export function legacyToTiptap(content: unknown): TiptapNode {
  // Already Tiptap doc
  if (isTiptapDoc(content)) {
    return content;
  }

  // Legacy format
  if (isLegacyContent(content)) {
    return textToTiptapDoc(content.text);
  }

  // Plain string
  if (typeof content === "string") {
    return textToTiptapDoc(content);
  }

  // Fallback: empty doc
  return { type: "doc", content: [{ type: "paragraph" }] };
}

/** Convert a plain text string to a Tiptap doc with paragraphs */
function textToTiptapDoc(text: string): TiptapNode {
  if (!text) {
    return { type: "doc", content: [{ type: "paragraph" }] };
  }

  const paragraphs: TiptapNode[] = text.split("\n").map((line) => ({
    type: "paragraph",
    content: line ? [{ type: "text", text: line }] : [],
  }));

  return { type: "doc", content: paragraphs };
}

// ============================================================
// Text Extraction
// ============================================================

/** Block-level node types that should add newlines when joining */
const BLOCK_TYPES = new Set([
  "paragraph",
  "heading",
  "blockquote",
  "codeBlock",
  "bulletList",
  "orderedList",
  "listItem",
  "mathBlock",
  "mediaImage",
  "mediaAudio",
  "mediaVideo",
]);

/**
 * Recursively extract all plain text from content.
 *
 * Handles:
 * - Tiptap JSON (recursive traverse including math nodes)
 * - Legacy `{ type: "text", text: "..." }`
 * - Plain string
 */
export function extractPlainText(content: unknown): string {
  if (!content) return "";
  if (typeof content === "string") return content;
  if (isLegacyContent(content)) return content.text;
  if (typeof content !== "object" || content === null) return "";

  const node = content as TiptapNode;

  // Math nodes — output the LaTeX source
  if (node.type === "mathInline" || node.type === "mathBlock") {
    return (node.attrs?.latex as string) ?? "";
  }

  // Media nodes — output caption if present
  if (node.type === "mediaImage" || node.type === "mediaAudio" || node.type === "mediaVideo") {
    return (node.attrs?.caption as string) ?? "";
  }

  // Text node
  if (node.type === "text") {
    return node.text ?? "";
  }

  // Recurse into children
  if (Array.isArray(node.content)) {
    const parts = node.content.map((child) => extractPlainText(child));
    const joined = parts.join("");

    // Add trailing newline for block-level elements
    if (node.type && BLOCK_TYPES.has(node.type)) {
      return joined + "\n";
    }

    return joined;
  }

  return "";
}

// ============================================================
// Content Checks
// ============================================================

/**
 * Check if content is empty (no meaningful text).
 * Used by canGoNext() in create/edit pages.
 */
export function isContentEmpty(content: unknown): boolean {
  return extractPlainText(content).trim().length === 0;
}
