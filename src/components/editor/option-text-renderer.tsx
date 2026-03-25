"use client";

import katex from "katex";
import DOMPurify from "isomorphic-dompurify";

// ============================================================
// Utilities
// ============================================================

const MATH_REGEX = /\$([^$]+)\$/g;

/** Check if text contains `$...$` math markers */
export function hasMathContent(text: string): boolean {
  return MATH_REGEX.test(text);
}

/**
 * Parse text into segments of plain text and math.
 * e.g. "ค่า $x^2$ เมื่อ $x=3$" → [{text:"ค่า "}, {latex:"x^2"}, {text:" เมื่อ "}, {latex:"x=3"}]
 */
function parseSegments(text: string): Array<{ text: string } | { latex: string }> {
  const segments: Array<{ text: string } | { latex: string }> = [];
  let lastIndex = 0;

  // Reset regex state
  const regex = new RegExp(MATH_REGEX.source, "g");
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    // Add preceding plain text
    if (match.index > lastIndex) {
      segments.push({ text: text.slice(lastIndex, match.index) });
    }
    // Add math segment
    segments.push({ latex: match[1] });
    lastIndex = regex.lastIndex;
  }

  // Add trailing plain text
  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex) });
  }

  return segments;
}

// ============================================================
// Component
// ============================================================

interface OptionTextRendererProps {
  text: string;
  className?: string;
}

/**
 * Renders option text with inline KaTeX math.
 * Text with `$...$` markers will have math rendered inline.
 * Plain text without `$` is returned as-is (zero overhead).
 */
export function OptionTextRenderer({ text, className }: OptionTextRendererProps) {
  // Fast path — no math markers
  if (!text.includes("$")) {
    return <span className={className}>{text}</span>;
  }

  const segments = parseSegments(text);

  return (
    <span className={className}>
      {segments.map((seg, i) => {
        if ("latex" in seg) {
          try {
            const html = katex.renderToString(seg.latex, {
              throwOnError: false,
              displayMode: false,
            });
            return (
              <span
                key={i}
                className="math-inline-option"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }}
              />
            );
          } catch {
            // Fallback: show raw LaTeX
            return (
              <span key={i} className="text-destructive">
                ${seg.latex}$
              </span>
            );
          }
        }
        return <span key={i}>{seg.text}</span>;
      })}
    </span>
  );
}
