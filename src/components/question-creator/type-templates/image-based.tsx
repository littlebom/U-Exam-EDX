"use client";

import { ImageIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { MCOption } from "./multiple-choice";
import { OptionsList } from "./multiple-choice";

interface ImageBasedProps {
  imageUrl: string;
  onImageUrlChange: (url: string) => void;
  options: MCOption[];
  correctAnswerId: string;
  onOptionsChange: (options: MCOption[]) => void;
  onCorrectChange: (id: string) => void;
}

export function ImageBasedTemplate({
  imageUrl,
  onImageUrlChange,
  options,
  correctAnswerId,
  onOptionsChange,
  onCorrectChange,
}: ImageBasedProps) {
  return (
    <div className="space-y-5">
      {/* Image URL */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">รูปภาพประกอบ</Label>
        <div className="flex items-center gap-3 rounded-lg border border-dashed bg-muted/20 p-4">
          <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
          <Input
            placeholder="วาง URL รูปภาพ (เช่น https://...)"
            value={imageUrl}
            onChange={(e) => onImageUrlChange(e.target.value)}
            className="flex-1"
          />
        </div>
        {imageUrl && (
          <div className="mt-2 overflow-hidden rounded-lg border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="Preview"
              className="max-h-48 w-full object-contain bg-muted/30"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        )}
      </div>

      {/* Options — reuse shared OptionsList (with media support) */}
      <OptionsList
        options={options}
        correctAnswerId={correctAnswerId}
        onOptionsChange={onOptionsChange}
        onCorrectChange={onCorrectChange}
        idPrefix="img-"
      />
    </div>
  );
}
