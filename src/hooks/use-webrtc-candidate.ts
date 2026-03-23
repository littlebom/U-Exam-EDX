"use client";

import { useRef, useEffect, useState, useCallback } from "react";

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

interface UseWebRTCCandidateOptions {
  proctoringSessionId: string | null;
  examSessionId: string;
  enabled: boolean;
  localStream: MediaStream | null;
}

/**
 * Candidate-side WebRTC hook for live video streaming to proctor.
 * Uses SSE for signaling (no separate WebSocket needed).
 */
export function useWebRTCCandidate({
  proctoringSessionId,
  examSessionId,
  enabled,
  localStream,
}: UseWebRTCCandidateOptions) {
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const [connected, setConnected] = useState(false);

  // Send signaling message via POST
  const sendSignal = useCallback(
    async (type: string, payload: unknown) => {
      if (!proctoringSessionId) return;
      try {
        await fetch(`/api/v1/proctoring/${proctoringSessionId}/signaling`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, payload, from: "candidate" }),
        });
      } catch {
        // Silently fail
      }
    },
    [proctoringSessionId]
  );

  // Create peer connection and start streaming
  useEffect(() => {
    if (!enabled || !proctoringSessionId || !localStream) return;

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pcRef.current = pc;

    // Add local tracks
    localStream.getTracks().forEach((track) => {
      pc.addTrack(track, localStream);
    });

    // Send ICE candidates to signaling server
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal("ice-candidate", event.candidate.toJSON());
      }
    };

    pc.onconnectionstatechange = () => {
      setConnected(pc.connectionState === "connected");
    };

    // Create offer and send to proctor
    const createOffer = async () => {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await sendSignal("offer", offer);
      } catch (err) {
        console.error("WebRTC offer creation failed:", err);
      }
    };

    createOffer();

    // Listen for signaling messages from proctor via SSE
    const handleSSESignal = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.from !== "proctor") return;

        if (data.type === "answer" && pc.signalingState === "have-local-offer") {
          pc.setRemoteDescription(new RTCSessionDescription(data.payload));
        } else if (data.type === "ice-candidate") {
          pc.addIceCandidate(new RTCIceCandidate(data.payload)).catch(() => {});
        }
      } catch {
        // Ignore parse errors
      }
    };

    // Subscribe to candidate SSE channel for WebRTC signals
    const eventSource = new EventSource(
      `/api/v1/profile/exam-sessions/${examSessionId}/proctoring/stream`
    );
    eventSource.addEventListener("webrtc-signal", handleSSESignal);

    return () => {
      eventSource.close();
      pc.close();
      pcRef.current = null;
      setConnected(false);
    };
  }, [enabled, proctoringSessionId, localStream, examSessionId, sendSignal]);

  return { connected };
}
