// ============================================================
// YouTube / Vimeo URL Parser & Utilities
// ============================================================

export interface VideoParseResult {
  provider: "youtube" | "vimeo";
  videoId: string;
  embedUrl: string;
  thumbnailUrl: string;
}

/**
 * Parse a YouTube or Vimeo URL and extract video info.
 * Returns null if the URL is not a valid video URL.
 */
export function parseVideoUrl(url: string): VideoParseResult | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  // Try YouTube
  const ytId = extractYouTubeId(trimmed);
  if (ytId) {
    return {
      provider: "youtube",
      videoId: ytId,
      embedUrl: `https://www.youtube.com/embed/${ytId}`,
      thumbnailUrl: `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`,
    };
  }

  // Try Vimeo
  const vimeoId = extractVimeoId(trimmed);
  if (vimeoId) {
    return {
      provider: "vimeo",
      videoId: vimeoId,
      embedUrl: `https://player.vimeo.com/video/${vimeoId}`,
      thumbnailUrl: "", // Vimeo thumbnails require API call, leave empty
    };
  }

  return null;
}

/**
 * Check if a URL is a valid YouTube or Vimeo URL.
 */
export function isValidVideoUrl(url: string): boolean {
  return parseVideoUrl(url) !== null;
}

// ── YouTube ID extraction ──

const YOUTUBE_PATTERNS = [
  // https://www.youtube.com/watch?v=VIDEO_ID
  /(?:youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]{11})/,
  // https://youtu.be/VIDEO_ID
  /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  // https://www.youtube.com/embed/VIDEO_ID
  /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  // https://www.youtube.com/v/VIDEO_ID
  /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
];

function extractYouTubeId(url: string): string | null {
  for (const pattern of YOUTUBE_PATTERNS) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

// ── Vimeo ID extraction ──

const VIMEO_PATTERNS = [
  // https://vimeo.com/123456789
  /(?:vimeo\.com\/)(\d+)/,
  // https://player.vimeo.com/video/123456789
  /(?:player\.vimeo\.com\/video\/)(\d+)/,
];

function extractVimeoId(url: string): string | null {
  for (const pattern of VIMEO_PATTERNS) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

// ── Duration formatting ──

/**
 * Format seconds to human-readable duration string.
 * Examples: 45 → "0:45", 125 → "2:05", 3661 → "1:01:01"
 */
export function formatDuration(seconds: number): string {
  const totalSeconds = Math.round(seconds);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}
