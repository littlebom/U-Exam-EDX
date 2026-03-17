"use client";

import { useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Camera, Loader2, ZoomIn, Trash2, ImagePlus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

// ─── Helpers ────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.slice(0, 2);
}

/** Create a cropped image from canvas */
async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area
): Promise<string> {
  const image = new Image();
  image.crossOrigin = "anonymous";

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = reject;
    image.src = imageSrc;
  });

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  // Output size 512×512 for good quality
  const outputSize = 512;
  canvas.width = outputSize;
  canvas.height = outputSize;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outputSize,
    outputSize
  );

  return canvas.toDataURL("image/jpeg", 0.9);
}

// ─── Component ─────────────────────────────────────────────────────

interface ProfileAvatarUploadProps {
  imageUrl: string | null;
  displayName: string;
}

export function ProfileAvatarUpload({
  imageUrl,
  displayName,
}: ProfileAvatarUploadProps) {
  const { update: updateSession } = useSession();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);

  // Crop state
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (base64Image: string) => {
      const res = await fetch("/api/v1/profile/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Image }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "อัปโหลดรูปไม่สำเร็จ");
      }
      return res.json();
    },
    onSuccess: (data: { data: { imageUrl: string } }) => {
      toast.success("อัปเดตรูปโปรไฟล์สำเร็จ");
      queryClient.invalidateQueries({ queryKey: ["profile-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["face-image"] });
      // Sync avatar to session so navbar updates immediately
      updateSession({ image: data.data.imageUrl }).catch(() => {});
      resetAndClose();
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/v1/profile/avatar", { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "ลบรูปไม่สำเร็จ");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("ลบรูปโปรไฟล์สำเร็จ");
      queryClient.invalidateQueries({ queryKey: ["profile-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["face-image"] });
      // Clear avatar from session so navbar updates immediately
      updateSession({ image: null }).catch(() => {});
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const resetAndClose = useCallback(() => {
    setDialogOpen(false);
    setImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  }, []);

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        toast.error("รองรับเฉพาะไฟล์ JPEG, PNG, WebP");
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("ไฟล์ต้องมีขนาดไม่เกิน 5 MB");
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result as string);
        setDialogOpen(true);
      };
      reader.readAsDataURL(file);

      // Reset input so same file can be selected again
      e.target.value = "";
    },
    []
  );

  const handleSave = useCallback(async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    try {
      const croppedBase64 = await getCroppedImg(imageSrc, croppedAreaPixels);
      uploadMutation.mutate(croppedBase64);
    } catch {
      toast.error("เกิดข้อผิดพลาดในการครอบรูป");
    }
  }, [imageSrc, croppedAreaPixels, uploadMutation]);

  const isSaving = uploadMutation.isPending;

  return (
    <>
      {/* Avatar with camera overlay */}
      <div className="group relative">
        <Avatar className="h-24 w-24">
          {imageUrl && <AvatarImage src={imageUrl} alt={displayName} />}
          <AvatarFallback className="bg-primary/10 text-2xl font-bold text-primary">
            {getInitials(displayName)}
          </AvatarFallback>
        </Avatar>

        {/* Camera overlay on hover */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
          aria-label="เปลี่ยนรูปโปรไฟล์"
        >
          <Camera className="h-6 w-6 text-white" />
        </button>
      </div>

      {/* Buttons below avatar */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => fileInputRef.current?.click()}
        >
          <ImagePlus className="h-4 w-4" />
          {imageUrl ? "เปลี่ยนรูป" : "อัปโหลดรูป"}
        </Button>
        {imageUrl && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-destructive hover:text-destructive"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            ลบรูป
          </Button>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Crop Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => !open && resetAndClose()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>ครอบรูปโปรไฟล์</DialogTitle>
            <DialogDescription>
              ปรับตำแหน่งและซูมเพื่อเลือกส่วนที่ต้องการ
            </DialogDescription>
          </DialogHeader>

          {imageSrc && (
            <div className="space-y-4">
              {/* Crop area */}
              <div className="relative h-72 w-full overflow-hidden rounded-lg bg-muted">
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              </div>

              {/* Zoom slider */}
              <div className="flex items-center gap-3 px-1">
                <ZoomIn className="h-4 w-4 text-muted-foreground" />
                <Slider
                  min={1}
                  max={3}
                  step={0.05}
                  value={[zoom]}
                  onValueChange={(val) => setZoom(val[0])}
                  className="flex-1"
                />
                <span className="w-10 text-right text-xs text-muted-foreground">
                  {zoom.toFixed(1)}×
                </span>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={resetAndClose}
                  disabled={isSaving}
                >
                  ยกเลิก
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  บันทึก
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
