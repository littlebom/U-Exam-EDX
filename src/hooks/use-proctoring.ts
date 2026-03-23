"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import type { ProctoringSettings } from "@/lib/validations/proctoring";

interface UseProctoringOptions {
  examSessionId: string;
  settings: ProctoringSettings | null;
  enabled: boolean;
}

interface UseProctoringReturn {
  /** Ref to attach to a hidden <video> element for webcam */
  videoRef: React.RefObject<HTMLVideoElement | null>;
  /** Current proctoring session ID */
  proctoringSessionId: string | null;
  /** Warning message from proctor (SSE) */
  warningMessage: string | null;
  /** Dismiss the warning */
  dismissWarning: () => void;
  /** Whether the exam was force-submitted by proctor */
  forceSubmitted: boolean;
  /** Whether webcam is active */
  webcamActive: boolean;
  /** Log a proctoring event from the exam page */
  logEvent: (type: string, severity?: string, metadata?: Record<string, unknown>) => void;
}

export function useProctoring({
  examSessionId,
  settings,
  enabled,
}: UseProctoringOptions): UseProctoringReturn {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [proctoringSessionId, setProctoringSessionId] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [forceSubmitted, setForceSubmitted] = useState(false);
  const [webcamActive, setWebcamActive] = useState(false);

  const screenshotIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const faceDetectionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const noFaceCountRef = useRef(0);
  const eventSourceRef = useRef<EventSource | null>(null);

  // ── Screenshot mode helpers ──
  const screenshotMode = settings?.screenshotMode ?? "both";
  const periodicEnabled = screenshotMode === "periodic" || screenshotMode === "both";
  const eventCaptureEnabled = screenshotMode === "on_event" || screenshotMode === "both";

  // ── Log event helper ──
  const logEvent = useCallback(
    async (type: string, severity = "LOW", metadata?: Record<string, unknown>) => {
      if (!examSessionId) return;
      try {
        await fetch(`/api/v1/profile/exam-sessions/${examSessionId}/proctoring/events`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, severity, metadata }),
        });
      } catch {
        // Silently fail — don't interrupt exam
      }
    },
    [examSessionId]
  );

  // ── Start proctoring session ──
  useEffect(() => {
    if (!enabled || !settings?.enabled || !examSessionId) return;

    const startSession = async () => {
      try {
        const res = await fetch(
          `/api/v1/profile/exam-sessions/${examSessionId}/proctoring/start`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              webcamEnabled: settings.requireWebcam,
              screenShareEnabled: false,
            }),
          }
        );
        const json = await res.json();
        if (json.success && json.data?.id) {
          setProctoringSessionId(json.data.id);
        }
      } catch {
        console.error("Failed to start proctoring session");
      }
    };

    startSession();
  }, [enabled, settings, examSessionId]);

  // ── Start webcam ──
  useEffect(() => {
    if (!enabled || !settings?.requireWebcam || !proctoringSessionId) return;

    const startWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 480, height: 360, facingMode: "user" },
          audio: false,
        });
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }

        setWebcamActive(true);
      } catch {
        toast.error("ไม่สามารถเข้าถึงกล้องได้ กรุณาอนุญาตการเข้าถึงกล้อง");
        logEvent("TECHNICAL_ISSUE", "MEDIUM", { error: "camera_denied" });
      }
    };

    startWebcam();

    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setWebcamActive(false);
    };
  }, [enabled, settings?.requireWebcam, proctoringSessionId, logEvent]);

  // ── Shared capture function (reused by periodic & event-triggered) ──
  const captureAndUpload = useCallback(
    async (reason?: string) => {
      if (!videoRef.current || !proctoringSessionId) return;

      try {
        const canvas = document.createElement("canvas");
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(videoRef.current, 0, 0, 640, 480);

        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, "image/webp", 0.7)
        );
        if (!blob) return;

        const formData = new FormData();
        formData.append("image", blob, "webcam.webp");
        formData.append("proctoringSessionId", proctoringSessionId);
        formData.append("type", "WEBCAM");
        if (reason) formData.append("reason", reason);

        await fetch("/api/v1/proctoring/screenshots", {
          method: "POST",
          body: formData,
        });
      } catch {
        // Silently fail
      }
    },
    [proctoringSessionId]
  );

  // ── Wrapper: log event + auto capture for MEDIUM/HIGH severity ──
  const logEventWithCapture = useCallback(
    (type: string, severity = "LOW", metadata?: Record<string, unknown>) => {
      logEvent(type, severity, metadata);
      // Auto capture for MEDIUM/HIGH severity events
      if ((severity === "HIGH" || severity === "MEDIUM") && eventCaptureEnabled && webcamActive) {
        captureAndUpload(type);
      }
    },
    [logEvent, eventCaptureEnabled, webcamActive, captureAndUpload]
  );

  // ── Event-triggered screenshot helper ──
  const captureOnEvent = useCallback(
    (eventType: string) => {
      if (!eventCaptureEnabled || !webcamActive) return;
      // Capture screenshot with event reason tag
      captureAndUpload(eventType);
    },
    [eventCaptureEnabled, webcamActive, captureAndUpload]
  );

  // ── Screenshot capture interval (periodic mode) ──
  useEffect(() => {
    if (!enabled || !settings?.requireWebcam || !proctoringSessionId || !webcamActive) return;
    if (!periodicEnabled) return; // Skip if mode is "on_event" only

    const interval = (settings.screenshotInterval || 30) * 1000;

    screenshotIntervalRef.current = setInterval(() => captureAndUpload(), interval);

    // Capture first screenshot immediately
    setTimeout(() => captureAndUpload(), 2000);

    return () => {
      if (screenshotIntervalRef.current) {
        clearInterval(screenshotIntervalRef.current);
      }
    };
  }, [enabled, settings, proctoringSessionId, webcamActive, periodicEnabled, captureAndUpload]);

  // ── Face detection loop ──
  useEffect(() => {
    if (!enabled || !settings?.faceDetectionEnabled || !webcamActive) return;

    let cancelled = false;

    const startDetection = async () => {
      const { initFaceDetection, detectFaces } = await import("@/lib/face-detection");
      const loaded = await initFaceDetection();
      if (!loaded || cancelled) return;

      faceDetectionIntervalRef.current = setInterval(async () => {
        if (cancelled || !videoRef.current) return;

        const faceCount = await detectFaces(videoRef.current);
        if (faceCount < 0) return; // Error or not ready

        if (faceCount === 0) {
          noFaceCountRef.current++;
          if (noFaceCountRef.current >= 2) {
            // 2 consecutive misses = log HIGH event + capture screenshot
            toast.warning("⚠️ ไม่พบใบหน้า กรุณาอยู่หน้าจอ", { duration: 3000 });
            logEvent("FACE_NOT_DETECTED", "HIGH", { consecutiveMisses: noFaceCountRef.current });
            captureOnEvent("FACE_NOT_DETECTED");
            noFaceCountRef.current = 0; // Reset after logging
          }
        } else if (faceCount > 1) {
          toast.warning("⚠️ ตรวจพบหลายใบหน้า", { duration: 3000 });
          logEvent("MULTIPLE_FACES", "HIGH", { faceCount });
          captureOnEvent("MULTIPLE_FACES");
          noFaceCountRef.current = 0;
        } else {
          // Exactly 1 face — normal
          noFaceCountRef.current = 0;
        }
      }, 4000); // Check every 4 seconds
    };

    startDetection();

    return () => {
      cancelled = true;
      if (faceDetectionIntervalRef.current) {
        clearInterval(faceDetectionIntervalRef.current);
      }
    };
  }, [enabled, settings?.faceDetectionEnabled, webcamActive, logEvent, captureOnEvent]);

  // ── SSE: listen for proctor messages & force-submit ──
  useEffect(() => {
    if (!enabled || !examSessionId) return;

    const eventSource = new EventSource(
      `/api/v1/profile/exam-sessions/${examSessionId}/proctoring/stream`
    );
    eventSourceRef.current = eventSource;

    eventSource.addEventListener("proctor-message", (e) => {
      try {
        const data = JSON.parse(e.data);
        setWarningMessage(data.message || "คำเตือนจากผู้คุมสอบ");
      } catch {
        // Ignore parse errors
      }
    });

    eventSource.addEventListener("force-submit", (e) => {
      try {
        const data = JSON.parse(e.data);
        toast.error(`การสอบถูกยุติโดยผู้คุมสอบ: ${data.reason || ""}`);
        setForceSubmitted(true);
      } catch {
        setForceSubmitted(true);
      }
    });

    eventSource.onerror = () => {
      // SSE reconnects automatically, no action needed
    };

    return () => {
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [enabled, examSessionId]);

  const dismissWarning = useCallback(() => {
    setWarningMessage(null);
  }, []);

  return {
    videoRef,
    proctoringSessionId,
    warningMessage,
    dismissWarning,
    forceSubmitted,
    webcamActive,
    logEvent: logEventWithCapture,
  };
}
