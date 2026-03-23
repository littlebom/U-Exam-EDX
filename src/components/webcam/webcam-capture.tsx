"use client";

import { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";
import { Camera, RotateCcw, Loader2, VideoOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface WebcamCaptureProps {
  onCapture: (imageSrc: string) => void;
  isProcessing?: boolean;
  capturedImage?: string | null;
  onRetake?: () => void;
  instructions?: string;
}

export function WebcamCapture({
  onCapture,
  isProcessing = false,
  capturedImage = null,
  onRetake,
  instructions = "จัดตำแหน่งใบหน้าให้อยู่ตรงกลางกรอบ",
}: WebcamCaptureProps) {
  const webcamRef = useRef<Webcam>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [cameraError, setCameraError] = useState<string>("");

  const handleUserMedia = useCallback(() => {
    setHasPermission(true);
    setIsReady(true);
    setCameraError("");
  }, []);

  const handleUserMediaError = useCallback((error: string | DOMException) => {
    setHasPermission(false);
    if (error instanceof DOMException) {
      if (error.name === "NotAllowedError") {
        setCameraError("การเข้าถึงกล้องถูกปฏิเสธ กรุณาอนุญาตในการตั้งค่าเบราว์เซอร์แล้วรีเฟรชหน้า");
      } else if (error.name === "NotFoundError") {
        setCameraError("ไม่พบกล้องในอุปกรณ์นี้ กรุณาเชื่อมต่อกล้องแล้วลองใหม่");
      } else if (error.name === "NotReadableError") {
        setCameraError("กล้องกำลังถูกใช้งานโดยแอปอื่น กรุณาปิดแอปอื่นแล้วลองใหม่");
      } else if (error.name === "OverconstrainedError") {
        setCameraError("กล้องไม่รองรับความละเอียดที่ต้องการ");
      } else {
        setCameraError(`ข้อผิดพลาดกล้อง: ${error.message || error.name}`);
      }
    } else {
      setCameraError(typeof error === "string" ? error : "ไม่สามารถเปิดกล้องได้");
    }
  }, []);

  const capture = useCallback(() => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      onCapture(imageSrc);
    }
  }, [onCapture]);

  // Show captured image
  if (capturedImage) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4">
            <div className="relative overflow-hidden rounded-xl border-2 border-primary/20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={capturedImage}
                alt="ภาพถ่ายใบหน้า"
                className="h-[360px] w-[480px] object-cover"
              />
              {isProcessing && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="flex flex-col items-center gap-2 text-white">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <p className="text-sm font-medium">กำลังประมวลผล...</p>
                  </div>
                </div>
              )}
            </div>
            {!isProcessing && onRetake && (
              <div className="flex gap-3">
                <Button variant="outline" onClick={onRetake} className="gap-2">
                  <RotateCcw className="h-4 w-4" />
                  ถ่ายใหม่
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Camera permission denied or error
  if (hasPermission === false) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <VideoOff className="h-8 w-8 text-destructive" />
            </div>
            <div>
              <p className="font-medium">ไม่สามารถเข้าถึงกล้องได้</p>
              <p className="mt-1 text-sm text-muted-foreground max-w-sm">
                {cameraError || "กรุณาอนุญาตการเข้าถึงกล้องในการตั้งค่าเบราว์เซอร์"}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setHasPermission(null);
                setIsReady(false);
                setCameraError("");
              }}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              ลองใหม่
            </Button>
            <div className="text-xs text-muted-foreground space-y-1 mt-2">
              <p>วิธีแก้ไข:</p>
              <p>1. คลิกไอคอนกุญแจ 🔒 ใน address bar → Camera → Allow</p>
              <p>2. รีเฟรชหน้านี้</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Webcam view
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col items-center gap-4">
          <div className="relative overflow-hidden rounded-xl border-2 border-muted">
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              screenshotQuality={0.92}
              videoConstraints={{
                width: { ideal: 480 },
                height: { ideal: 360 },
                facingMode: "user",
              }}
              onUserMedia={handleUserMedia}
              onUserMediaError={handleUserMediaError}
              className="h-[360px] w-[480px] object-cover"
              mirrored
            />
            {/* Face + neck + shoulders guide overlay */}
            <div className="pointer-events-none absolute inset-0 flex items-start justify-center pt-12">
              <div className="flex flex-col items-center">
                {/* Head (oval) */}
                <div className="h-52 w-44 rounded-full border-2 border-dashed border-primary/40" />
                {/* Neck */}
                <div className="h-8 w-16 border-x-2 border-dashed border-primary/30" />
                {/* Shoulders (wide arc) */}
                <div className="h-16 w-72 rounded-t-full border-2 border-b-0 border-dashed border-primary/25" />
              </div>
            </div>
            {!isReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>

          <p className="text-sm text-muted-foreground">{instructions}</p>

          <Button
            onClick={capture}
            disabled={!isReady || isProcessing}
            className="gap-2"
            size="lg"
          >
            <Camera className="h-5 w-5" />
            ถ่ายรูป
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
