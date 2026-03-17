"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ScanFace,
  CheckCircle2,
  AlertTriangle,
  Camera,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { WebcamCapture } from "@/components/webcam/webcam-capture";
import { toast } from "sonner";

export function FaceImageCard() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  // Fetch current face image
  const { data: faceData, isLoading } = useQuery({
    queryKey: ["face-image"],
    queryFn: async () => {
      const res = await fetch("/api/v1/profile/face-image");
      const json = await res.json();
      return json.data as { imageUrl: string | null };
    },
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (image: string) => {
      const res = await fetch("/api/v1/profile/face-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "อัปโหลดรูปไม่สำเร็จ");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("บันทึกรูปใบหน้าเรียบร้อยแล้ว");
      queryClient.invalidateQueries({ queryKey: ["face-image"] });
      queryClient.invalidateQueries({ queryKey: ["profile-dashboard"] });
      setCapturedImage(null);
      setDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleCapture = (imageSrc: string) => {
    setCapturedImage(imageSrc);
  };

  const handleRetake = () => {
    setCapturedImage(null);
  };

  const handleSave = () => {
    if (capturedImage) {
      uploadMutation.mutate(capturedImage);
    }
  };

  const handleOpenDialog = () => {
    setCapturedImage(null);
    setDialogOpen(true);
  };

  const hasFaceImage = !!faceData?.imageUrl;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent className="flex items-center justify-between py-4 px-5">
          <div className="flex items-center gap-3">
            <ScanFace className="h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="text-sm font-medium">รูปใบหน้ายืนยันตัวตน</p>
              {hasFaceImage ? (
                <p className="flex items-center gap-1 text-xs text-green-700 dark:text-green-400">
                  <CheckCircle2 className="h-3 w-3" />
                  ตั้งค่าแล้ว
                </p>
              ) : (
                <p className="flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="h-3 w-3" />
                  ยังไม่ได้ตั้งค่า
                </p>
              )}
            </div>
          </div>
          <Button
            variant={hasFaceImage ? "outline" : "default"}
            size="sm"
            className="gap-1.5 shrink-0"
            onClick={handleOpenDialog}
          >
            <Camera className="h-4 w-4" />
            {hasFaceImage ? "ถ่ายใหม่" : "ตั้งค่า"}
          </Button>
        </CardContent>
      </Card>

      {/* Webcam Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ScanFace className="h-5 w-5 text-primary" />
              {hasFaceImage ? "ถ่ายรูปใบหน้าใหม่" : "ตั้งค่ารูปใบหน้า"}
            </DialogTitle>
            <DialogDescription>
              จัดใบหน้าให้อยู่ตรงกลาง ในที่แสงสว่างเพียงพอ
              ไม่สวมหมวกหรือแว่นกันแดด
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <WebcamCapture
              onCapture={handleCapture}
              capturedImage={capturedImage}
              onRetake={handleRetake}
              isProcessing={uploadMutation.isPending}
              instructions="จัดใบหน้าให้อยู่ตรงกลางกรอบวงรี แล้วกดถ่ายรูป"
            />

            {capturedImage && !uploadMutation.isPending && (
              <div className="flex justify-center gap-3">
                <Button variant="outline" onClick={handleRetake}>
                  ถ่ายใหม่
                </Button>
                <Button onClick={handleSave} className="gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  บันทึกรูปใบหน้า
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
