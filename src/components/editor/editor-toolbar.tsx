"use client";

import { useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Code2,
  Sigma,
  SquareSigma,
  ImageIcon,
  Music,
  Video,
  Undo,
  Redo,
  Loader2,
} from "lucide-react";
import { VideoUrlDialog } from "./extensions/video-url-dialog";
import {
  isAllowedImageType,
  isAllowedAudioType,
  MAX_IMAGE_SIZE,
  MAX_AUDIO_SIZE,
} from "@/lib/validations/media";

// ============================================================
// Types
// ============================================================
interface EditorToolbarProps {
  editor: Editor | null;
}

interface ToolbarButton {
  icon: typeof Bold;
  label: string;
  action: (editor: Editor) => void;
  isActive?: (editor: Editor) => boolean;
}

// ============================================================
// Toolbar Button Groups
// ============================================================
const TEXT_BUTTONS: ToolbarButton[] = [
  {
    icon: Bold,
    label: "ตัวหนา",
    action: (e) => e.chain().focus().toggleBold().run(),
    isActive: (e) => e.isActive("bold"),
  },
  {
    icon: Italic,
    label: "ตัวเอียง",
    action: (e) => e.chain().focus().toggleItalic().run(),
    isActive: (e) => e.isActive("italic"),
  },
  {
    icon: Underline,
    label: "ขีดเส้นใต้",
    action: (e) => e.chain().focus().toggleUnderline().run(),
    isActive: (e) => e.isActive("underline"),
  },
  {
    icon: Strikethrough,
    label: "ขีดฆ่า",
    action: (e) => e.chain().focus().toggleStrike().run(),
    isActive: (e) => e.isActive("strike"),
  },
];

const STRUCTURE_BUTTONS: ToolbarButton[] = [
  {
    icon: Heading2,
    label: "หัวข้อ 2",
    action: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
    isActive: (e) => e.isActive("heading", { level: 2 }),
  },
  {
    icon: Heading3,
    label: "หัวข้อ 3",
    action: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(),
    isActive: (e) => e.isActive("heading", { level: 3 }),
  },
  {
    icon: List,
    label: "รายการ",
    action: (e) => e.chain().focus().toggleBulletList().run(),
    isActive: (e) => e.isActive("bulletList"),
  },
  {
    icon: ListOrdered,
    label: "รายการลำดับ",
    action: (e) => e.chain().focus().toggleOrderedList().run(),
    isActive: (e) => e.isActive("orderedList"),
  },
  {
    icon: Quote,
    label: "อ้างอิง",
    action: (e) => e.chain().focus().toggleBlockquote().run(),
    isActive: (e) => e.isActive("blockquote"),
  },
];

const CODE_BUTTONS: ToolbarButton[] = [
  {
    icon: Code,
    label: "โค้ด",
    action: (e) => e.chain().focus().toggleCode().run(),
    isActive: (e) => e.isActive("code"),
  },
  {
    icon: Code2,
    label: "บล็อกโค้ด",
    action: (e) => e.chain().focus().toggleCodeBlock().run(),
    isActive: (e) => e.isActive("codeBlock"),
  },
];

const MATH_BUTTONS: ToolbarButton[] = [
  {
    icon: Sigma,
    label: "สูตรคณิตศาสตร์ (inline)",
    action: (e) => e.chain().focus().insertMathInline({ latex: "x^2" }).run(),
  },
  {
    icon: SquareSigma,
    label: "สูตรคณิตศาสตร์ (block)",
    action: (e) =>
      e.chain().focus().insertMathBlock({ latex: "\\frac{a}{b}" }).run(),
  },
];

// ============================================================
// Component
// ============================================================
export function EditorToolbar({ editor }: EditorToolbarProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<"image" | "audio" | null>(null);

  if (!editor) return null;

  const handleFileUpload = async (file: File, category: "image" | "audio") => {
    if (category === "image") {
      if (!isAllowedImageType(file.type) || file.size > MAX_IMAGE_SIZE) return;
    } else {
      if (!isAllowedAudioType(file.type) || file.size > MAX_AUDIO_SIZE) return;
    }

    setUploading(category);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/v1/upload", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();

      if (!json.success) return;

      const data = json.data;

      if (category === "image") {
        editor
          .chain()
          .focus()
          .insertMediaImage({
            mediaFileId: data.id,
            src: data.url,
            thumbnailSrc: data.thumbnailUrl,
            alt: data.filename,
            width: data.width,
            height: data.height,
          })
          .run();
      } else {
        editor
          .chain()
          .focus()
          .insertMediaAudio({
            mediaFileId: data.id,
            src: data.url,
            filename: data.filename,
            duration: data.duration,
            mimeType: data.mimeType,
          })
          .run();
      }
    } catch {
      // silently fail
    } finally {
      setUploading(null);
    }
  };

  const renderGroup = (buttons: ToolbarButton[]) =>
    buttons.map((btn) => (
      <Button
        key={btn.label}
        type="button"
        variant="ghost"
        size="icon"
        className={`h-8 w-8 ${
          btn.isActive?.(editor)
            ? "bg-muted text-foreground"
            : "text-muted-foreground"
        }`}
        onClick={() => btn.action(editor)}
        title={btn.label}
      >
        <btn.icon className="h-4 w-4" />
      </Button>
    ));

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b px-2 py-1.5">
      {/* Text formatting */}
      {renderGroup(TEXT_BUTTONS)}

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Structure */}
      {renderGroup(STRUCTURE_BUTTONS)}

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Code */}
      {renderGroup(CODE_BUTTONS)}

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Math */}
      {renderGroup(MATH_BUTTONS)}

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Media */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground"
        onClick={() => imageInputRef.current?.click()}
        disabled={uploading === "image"}
        title="แทรกรูปภาพ"
      >
        {uploading === "image" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ImageIcon className="h-4 w-4" />
        )}
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground"
        onClick={() => audioInputRef.current?.click()}
        disabled={uploading === "audio"}
        title="แทรกเสียง"
      >
        {uploading === "audio" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Music className="h-4 w-4" />
        )}
      </Button>

      <VideoUrlDialog
        onInsert={(attrs) => {
          editor.chain().focus().insertMediaVideo(attrs).run();
        }}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground"
          title="แทรกวิดีโอ"
        >
          <Video className="h-4 w-4" />
        </Button>
      </VideoUrlDialog>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Undo/Redo */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="เลิกทำ"
      >
        <Undo className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="ทำซ้ำ"
      >
        <Redo className="h-4 w-4" />
      </Button>

      {/* Hidden file inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileUpload(file, "image");
          e.target.value = "";
        }}
      />
      <input
        ref={audioInputRef}
        type="file"
        accept="audio/mpeg,audio/wav,audio/ogg,audio/mp4,audio/x-m4a"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileUpload(file, "audio");
          e.target.value = "";
        }}
      />
    </div>
  );
}
