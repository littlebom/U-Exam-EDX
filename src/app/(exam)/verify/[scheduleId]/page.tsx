"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import * as faceapi from "face-api.js";
import {
  ScanFace,
  CheckCircle2,
  XCircle,
  Loader2,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { WebcamCapture } from "@/components/webcam/webcam-capture";
import { toast } from "sonner";

type VerifyState =
  | "loading-models"
  | "loading-reference"
  | "ready"
  | "captured"
  | "verifying"
  | "success"
  | "failed"
  | "no-reference"
  | "error";

export default function FaceVerifyPage() {
  const params = useParams<{ scheduleId: string }>();
  const router = useRouter();

  const [state, setState] = useState<VerifyState>("loading-models");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [attempts, setAttempts] = useState(0);
  const referenceDescriptor = useRef<Float32Array | null>(null);

  // Load face-api.js models
  useEffect(() => {
    async function loadModels() {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
          faceapi.nets.faceLandmark68TinyNet.loadFromUri("/models"),
          faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
        ]);
        setState("loading-reference");
      } catch {
        setState("error");
        setErrorMessage("ไม่สามารถโหลดโมเดลตรวจจับใบหน้าได้");
      }
    }
    loadModels();
  }, []);

  // Load reference face image
  useEffect(() => {
    if (state !== "loading-reference") return;

    async function loadReference() {
      try {
        const res = await fetch("/api/v1/profile/face-image");
        const json = await res.json();

        if (!json.data?.imageUrl) {
          setState("no-reference");
          return;
        }

        // Load reference image and extract descriptor
        const img = await faceapi.fetchImage(json.data.imageUrl);
        const detection = await faceapi
          .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks(true)
          .withFaceDescriptor();

        if (!detection) {
          setState("error");
          setErrorMessage(
            "ไม่สามารถตรวจจับใบหน้าจากรูปอ้างอิงได้ กรุณาถ่ายรูปใบหน้าใหม่"
          );
          return;
        }

        referenceDescriptor.current = detection.descriptor;
        setState("ready");
      } catch {
        setState("error");
        setErrorMessage("ไม่สามารถโหลดรูปใบหน้าอ้างอิงได้");
      }
    }
    loadReference();
  }, [state]);

  // Verify captured face
  const verifyFace = useCallback(
    async (imageSrc: string) => {
      setState("verifying");

      try {
        // Create image element from base64
        const img = new Image();
        img.crossOrigin = "anonymous";

        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error("Failed to load image"));
          img.src = imageSrc;
        });

        // Detect face in captured image
        const detection = await faceapi
          .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks(true)
          .withFaceDescriptor();

        if (!detection) {
          setState("failed");
          setErrorMessage("ไม่พบใบหน้าในรูป กรุณาถ่ายรูปใหม่ โดยหันหน้าตรงในที่แสงสว่าง");
          setAttempts((a) => a + 1);
          return;
        }

        if (!referenceDescriptor.current) {
          setState("error");
          setErrorMessage("ไม่มีรูปใบหน้าอ้างอิง");
          return;
        }

        // Compare face descriptors (Euclidean distance)
        const distance = faceapi.euclideanDistance(
          referenceDescriptor.current,
          detection.descriptor
        );

        // Threshold: 0.6 = match (lower = more strict)
        const isMatch = distance < 0.6;

        if (isMatch) {
          setState("success");
          toast.success("ยืนยันตัวตนสำเร็จ!");
          // Redirect to exam after 1.5 seconds
          setTimeout(() => {
            router.push(`/take/${params.scheduleId}`);
          }, 1500);
        } else {
          setState("failed");
          setErrorMessage(
            "ใบหน้าไม่ตรงกับรูปอ้างอิง กรุณาลองใหม่อีกครั้ง"
          );
          setAttempts((a) => a + 1);
        }
      } catch {
        setState("failed");
        setErrorMessage("เกิดข้อผิดพลาดในการตรวจสอบใบหน้า");
        setAttempts((a) => a + 1);
      }
    },
    [params.scheduleId, router]
  );

  const handleCapture = useCallback(
    (imageSrc: string) => {
      setCapturedImage(imageSrc);
      verifyFace(imageSrc);
    },
    [verifyFace]
  );

  const handleRetake = () => {
    setCapturedImage(null);
    setState("ready");
    setErrorMessage("");
  };

  // ─── Render States ──────────────────────────────────────────────

  // Loading models
  if (state === "loading-models" || state === "loading-reference") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="max-w-md text-center">
          <CardContent className="flex flex-col items-center gap-4 pt-6">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <div>
              <p className="font-medium">
                {state === "loading-models"
                  ? "กำลังโหลดระบบตรวจจับใบหน้า..."
                  : "กำลังโหลดรูปใบหน้าอ้างอิง..."}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                กรุณารอสักครู่
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No reference image
  if (state === "no-reference") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
              <AlertTriangle className="h-7 w-7 text-amber-600" />
            </div>
            <CardTitle>ยังไม่มีรูปใบหน้าอ้างอิง</CardTitle>
            <CardDescription>
              กรุณาตั้งค่ารูปใบหน้าก่อนเข้าสอบ
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button onClick={() => router.push("/profile")}>
              ตั้งค่ารูปใบหน้า
            </Button>
            <Button
              variant="ghost"
              onClick={() => router.push("/profile/my-exams")}
            >
              กลับหน้าการสอบ
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (state === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
              <XCircle className="h-7 w-7 text-destructive" />
            </div>
            <CardTitle>เกิดข้อผิดพลาด</CardTitle>
            <CardDescription>{errorMessage}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button onClick={() => router.push("/profile")}>
              ตั้งค่ารูปใบหน้าใหม่
            </Button>
            <Button
              variant="ghost"
              onClick={() => router.push("/profile/my-exams")}
            >
              กลับหน้าการสอบ
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success
  if (state === "success") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="max-w-md text-center">
          <CardContent className="flex flex-col items-center gap-4 pt-8 pb-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <ShieldCheck className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <p className="text-lg font-semibold text-green-700 dark:text-green-400">
                ยืนยันตัวตนสำเร็จ!
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                กำลังนำคุณเข้าสู่หน้าสอบ...
              </p>
            </div>
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Ready / Captured / Failed / Verifying
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <ScanFace className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-xl font-bold">ยืนยันตัวตนก่อนเข้าสอบ</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            ถ่ายรูปใบหน้าเพื่อเปรียบเทียบกับรูปอ้างอิง
          </p>
        </div>

        {/* Failed message */}
        {state === "failed" && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="flex items-center gap-3 pt-4 pb-4">
              <XCircle className="h-5 w-5 shrink-0 text-destructive" />
              <div>
                <p className="text-sm font-medium text-destructive">
                  {errorMessage}
                </p>
                <p className="text-xs text-muted-foreground">
                  ลองครั้งที่ {attempts}/5
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Too many attempts */}
        {attempts >= 5 ? (
          <Card className="text-center">
            <CardContent className="flex flex-col items-center gap-4 pt-6">
              <AlertTriangle className="h-10 w-10 text-amber-500" />
              <div>
                <p className="font-medium">ลองยืนยันตัวตนเกินจำนวนครั้ง</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  กรุณาติดต่อผู้ดูแลระบบหรือลองตั้งค่ารูปใบหน้าใหม่
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => router.push("/profile")}
                >
                  ตั้งค่ารูปใบหน้าใหม่
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => router.push("/profile/my-exams")}
                >
                  กลับหน้าการสอบ
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Webcam */
          <WebcamCapture
            onCapture={handleCapture}
            capturedImage={state === "failed" ? null : capturedImage}
            onRetake={handleRetake}
            isProcessing={state === "verifying"}
            instructions="จัดใบหน้าให้อยู่ตรงกลาง แล้วกดถ่ายรูปเพื่อยืนยัน"
          />
        )}

        {/* Back link + Skip option */}
        <div className="text-center space-y-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/profile/my-exams")}
          >
            กลับหน้าการสอบของฉัน
          </Button>
          <div>
            <Button
              variant="link"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={() => {
                if (confirm("ข้ามการยืนยันตัวตน? (สำหรับกรณีกล้องมีปัญหา)")) {
                  router.push(`/take/${params.scheduleId}`);
                }
              }}
            >
              ข้ามการยืนยัน (กล้องมีปัญหา)
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
