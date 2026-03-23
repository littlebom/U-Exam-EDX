"use client";

import { useEffect } from "react";
import { useAppSession } from "@/hooks/use-session";
import { useDetail } from "@/hooks/use-api";

interface TenantSettings {
  primaryColor?: string;
}

interface TenantData {
  id: string;
  settings: TenantSettings | null;
}

/**
 * Convert HEX color (#rrggbb) to OKLCh CSS string.
 * Uses an approximation via linear sRGB -> OKLab -> OKLCh.
 */
function hexToOklch(hex: string): string | null {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return null;

  const r = parseInt(m[1].slice(0, 2), 16) / 255;
  const g = parseInt(m[1].slice(2, 4), 16) / 255;
  const b = parseInt(m[1].slice(4, 6), 16) / 255;

  // sRGB -> linear RGB
  const toLinear = (c: number) =>
    c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  const lr = toLinear(r);
  const lg = toLinear(g);
  const lb = toLinear(b);

  // Linear RGB -> LMS (using OKLab matrix)
  const l_ = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
  const m_ = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
  const s_ = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;

  // LMS -> OKLab
  const l3 = Math.cbrt(l_);
  const m3 = Math.cbrt(m_);
  const s3 = Math.cbrt(s_);

  const L = 0.2104542553 * l3 + 0.7936177850 * m3 - 0.0040720468 * s3;
  const a = 1.9779984951 * l3 - 2.4285922050 * m3 + 0.4505937099 * s3;
  const bOk = 0.0259040371 * l3 + 0.7827717662 * m3 - 0.8086757660 * s3;

  // OKLab -> OKLCh
  const C = Math.sqrt(a * a + bOk * bOk);
  let h = (Math.atan2(bOk, a) * 180) / Math.PI;
  if (h < 0) h += 360;

  return `oklch(${L.toFixed(3)} ${C.toFixed(3)} ${h.toFixed(1)})`;
}

/**
 * Generate a lighter variant for dark mode (increase L by ~0.2, keep C and H similar)
 */
function hexToOklchLight(hex: string): string | null {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return null;

  const r = parseInt(m[1].slice(0, 2), 16) / 255;
  const g = parseInt(m[1].slice(2, 4), 16) / 255;
  const b = parseInt(m[1].slice(4, 6), 16) / 255;

  const toLinear = (c: number) =>
    c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  const lr = toLinear(r);
  const lg = toLinear(g);
  const lb = toLinear(b);

  const l_ = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
  const m_ = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
  const s_ = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;

  const l3 = Math.cbrt(l_);
  const m3 = Math.cbrt(m_);
  const s3 = Math.cbrt(s_);

  const L = 0.2104542553 * l3 + 0.7936177850 * m3 - 0.0040720468 * s3;
  const a = 1.9779984951 * l3 - 2.4285922050 * m3 + 0.4505937099 * s3;
  const bOk = 0.0259040371 * l3 + 0.7827717662 * m3 - 0.8086757660 * s3;

  const C = Math.sqrt(a * a + bOk * bOk);
  let h = (Math.atan2(bOk, a) * 180) / Math.PI;
  if (h < 0) h += 360;

  // Lighten for dark mode
  const lightL = Math.min(L + 0.21, 0.85);

  return `oklch(${lightL.toFixed(3)} ${C.toFixed(3)} ${h.toFixed(1)})`;
}

export function TenantThemeProvider({ children }: { children: React.ReactNode }) {
  const { tenant } = useAppSession();
  const tenantId = tenant?.id;

  const { data: tenantData } = useDetail<TenantData>(
    "tenant-theme",
    `/api/v1/tenants/${tenantId}`,
    !!tenantId
  );

  const primaryColor = tenantData?.settings?.primaryColor;

  useEffect(() => {
    if (!primaryColor) return;

    const oklchColor = hexToOklch(primaryColor);
    const oklchLightColor = hexToOklchLight(primaryColor);
    if (!oklchColor || !oklchLightColor) return;

    // Create or update a <style> tag to override CSS custom properties
    const styleId = "tenant-theme-override";
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }

    styleEl.textContent = `
      :root {
        --primary: ${oklchColor};
        --ring: ${oklchColor};
        --chart-1: ${oklchColor};
        --sidebar-primary: ${oklchColor};
        --sidebar-ring: ${oklchColor};
      }
      .dark {
        --primary: ${oklchLightColor};
        --ring: ${oklchLightColor};
        --chart-1: ${oklchLightColor};
        --sidebar-primary: ${oklchLightColor};
        --sidebar-ring: ${oklchLightColor};
      }
    `;

    return () => {
      // Cleanup on unmount
      styleEl?.remove();
    };
  }, [primaryColor]);

  return <>{children}</>;
}
