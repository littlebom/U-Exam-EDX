"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { Camera, Loader2, WifiOff } from "lucide-react";

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

interface LiveVideoFeedProps {
  proctoringSessionId: string;
  className?: string;
}

/**
 * Admin-side component that receives a WebRTC stream from a candidate.
 * Uses SSE for signaling and displays the remote video.
 */
export function LiveVideoFeed({
  proctoringSessionId,
  className = "",
}: LiveVideoFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const [status, setStatus] = useState<"connecting" | "connected" | "failed">(
    "connecting"
  );

  const sendSignal = useCallback(
    async (type: string, payload: unknown) => {
      try {
        await fetch(
          `/api/v1/proctoring/${proctoringSessionId}/signaling`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type, payload, from: "proctor" }),
          }
        );
      } catch {
        // Silently fail
      }
    },
    [proctoringSessionId]
  );

  useEffect(() => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pcRef.current = pc;

    // When we receive remote track, display it
    pc.ontrack = (event) => {
      if (videoRef.current && event.streams[0]) {
        videoRef.current.srcObject = event.streams[0];
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal("ice-candidate", event.candidate.toJSON());
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") setStatus("connected");
      else if (pc.connectionState === "failed") setStatus("failed");
    };

    // Listen for signaling from candidate via admin SSE
    // We need to listen for webrtc-signal events on the admin proctoring stream
    const eventSource = new EventSource("/api/v1/proctoring/stream");

    eventSource.addEventListener("webrtc-signal", async (event) => {
      try {
        const data = JSON.parse(event.data);
        if (
          data.from !== "candidate" ||
          data.proctoringSessionId !== proctoringSessionId
        )
          return;

        if (data.type === "offer") {
          await pc.setRemoteDescription(
            new RTCSessionDescription(data.payload)
          );
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          await sendSignal("answer", answer);
        } else if (data.type === "ice-candidate") {
          await pc.addIceCandidate(new RTCIceCandidate(data.payload));
        }
      } catch {
        // Ignore
      }
    });

    return () => {
      eventSource.close();
      pc.close();
      pcRef.current = null;
    };
  }, [proctoringSessionId, sendSignal]);

  return (
    <div
      className={`relative bg-black rounded-lg overflow-hidden aspect-video ${className}`}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />

      {/* Status overlay */}
      {status === "connecting" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white">
          <Loader2 className="h-6 w-6 animate-spin mb-2" />
          <p className="text-xs">กำลังเชื่อมต่อ...</p>
        </div>
      )}

      {status === "failed" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white">
          <WifiOff className="h-6 w-6 mb-2" />
          <p className="text-xs">การเชื่อมต่อล้มเหลว</p>
        </div>
      )}

      {status === "connected" && (
        <div className="absolute top-2 right-2">
          <div className="flex items-center gap-1 bg-green-600/80 text-white text-[10px] px-2 py-0.5 rounded-full">
            <Camera className="h-3 w-3" />
            LIVE
          </div>
        </div>
      )}
    </div>
  );
}
