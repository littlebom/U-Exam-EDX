"use client";

/**
 * Face detection utility using face-api.js (TinyFaceDetector).
 * Runs client-side in the browser during exam proctoring.
 */

let faceapi: typeof import("face-api.js") | null = null;
let modelsLoaded = false;

/**
 * Initialize face detection by loading the TinyFaceDetector model.
 * Models should be in /models/ directory (public/).
 */
export async function initFaceDetection(): Promise<boolean> {
  if (modelsLoaded) return true;

  try {
    faceapi = await import("face-api.js");
    await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
    modelsLoaded = true;
    return true;
  } catch (error) {
    console.error("Failed to load face detection models:", error);
    return false;
  }
}

/**
 * Detect faces in a video element.
 * Returns the number of faces detected.
 */
export async function detectFaces(
  videoElement: HTMLVideoElement
): Promise<number> {
  if (!faceapi || !modelsLoaded) return -1; // -1 = not initialized

  try {
    const detections = await faceapi.detectAllFaces(
      videoElement,
      new faceapi.TinyFaceDetectorOptions({
        inputSize: 224, // smallest = fastest
        scoreThreshold: 0.5,
      })
    );
    return detections.length;
  } catch {
    return -1; // Error during detection
  }
}

/**
 * Check if face detection is ready.
 */
export function isFaceDetectionReady(): boolean {
  return modelsLoaded;
}
