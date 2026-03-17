"use client";

import { useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import UnderlineExt from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import type { JSONContent } from "@tiptap/core";
import { MathInline } from "./extensions/math-inline";
import { MathBlock } from "./extensions/math-block";
import { MediaImage } from "./extensions/media-image";
import { MediaAudio } from "./extensions/media-audio";
import { MediaVideo } from "./extensions/media-video";
import { EditorToolbar } from "./editor-toolbar";
import { cn } from "@/lib/utils";

// ============================================================
// Types
// ============================================================
interface RichTextEditorProps {
  content: JSONContent | null;
  onChange: (content: JSONContent) => void;
  placeholder?: string;
  className?: string;
}

// ============================================================
// Component
// ============================================================
export function RichTextEditor({
  content,
  onChange,
  placeholder = "พิมพ์เนื้อหา...",
  className,
}: RichTextEditorProps) {
  // Track whether content updates come from internal editing (to avoid loops)
  const isInternalUpdate = useRef(false);

  const editor = useEditor({
    // SSR safe: don't render on server (Next.js requirement)
    immediatelyRender: false,

    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
      }),
      UnderlineExt,
      Placeholder.configure({
        placeholder,
      }),
      MathInline,
      MathBlock,
      MediaImage,
      MediaAudio,
      MediaVideo,
    ],

    content: content ?? { type: "doc", content: [{ type: "paragraph" }] },

    onUpdate: ({ editor: e }) => {
      isInternalUpdate.current = true;
      onChange(e.getJSON());
    },

    editorProps: {
      attributes: {
        class: "prose-editor-content outline-none min-h-[120px] px-4 py-3",
      },
    },
  });

  // Sync external content changes into the editor
  // (e.g., when edit page loads question data after initial render)
  useEffect(() => {
    if (!editor || !content) return;

    // Skip if the update came from the editor itself (avoid infinite loop)
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }

    // Only set content if the editor is currently empty and new content is available
    const currentText = editor.getText().trim();
    if (!currentText && content.type === "doc") {
      editor.commands.setContent(content);
    }
  }, [editor, content]);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border transition-colors focus-within:ring-2 focus-within:ring-ring/20",
        className
      )}
    >
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
