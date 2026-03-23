import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { requirePermission } from "@/lib/rbac";
import { handleApiError } from "@/lib/errors";
import {
  CertificateTemplate,
  type CertificatePdfData,
  type Signatory,
} from "@/lib/pdf/certificate-template";
import QRCode from "qrcode";

export async function GET(request: NextRequest) {
  try {
    await requirePermission("certificate:template");

    const url = new URL(request.url);
    const templateName = url.searchParams.get("name") || "Sample Template";
    const logoUrl = url.searchParams.get("logoUrl") || null;
    const backgroundUrl = url.searchParams.get("backgroundUrl") || null;
    const background = url.searchParams.get("background") || "white";
    const primaryColor = url.searchParams.get("primaryColor") || "#741717";
    const borderStyle = url.searchParams.get("borderStyle") || "double";

    let signatories: Signatory[] = [];
    try {
      const sigJson = url.searchParams.get("signatories");
      if (sigJson) {
        const parsed = JSON.parse(sigJson);
        if (Array.isArray(parsed)) {
          signatories = parsed.filter(
            (s: Signatory) => s.name?.trim() || s.title?.trim()
          );
        }
      }
    } catch {
      // ignore parse errors
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const sampleNumber = "CERT-2026-PREVIEW";
    const verifyUrl = `${appUrl}/verify/certificate/${sampleNumber}`;
    const qrCodeDataUrl = await QRCode.toDataURL(verifyUrl, {
      width: 200,
      margin: 1,
    });

    // Resolve relative URLs to absolute for react-pdf
    const resolveUrl = (u: string | null | undefined) =>
      u && u.startsWith("/") ? `${appUrl}${u}` : u ?? null;

    const resolvedLogoUrl = resolveUrl(logoUrl);
    const resolvedBackgroundUrl = resolveUrl(backgroundUrl);

    // Resolve signature URLs
    signatories = signatories.map((s) => ({
      ...s,
      signatureUrl: resolveUrl(s.signatureUrl),
    }));

    const pdfData: CertificatePdfData = {
      certificateNumber: sampleNumber,
      candidateName: "สมชาย ใจดี",
      examTitle: "การสอบวัดความรู้ด้านวิศวกรรมซอฟต์แวร์",
      score: 85,
      maxScore: 100,
      percentage: 85,
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(
        Date.now() + 2 * 365 * 24 * 60 * 60 * 1000
      ).toISOString(),
      templateName,
      qrCodeDataUrl,
      logoUrl: resolvedLogoUrl,
      primaryColor,
      background,
      backgroundUrl: resolvedBackgroundUrl,
      signatories,
    };

    void borderStyle; // reserved for future use

    const buffer = await renderToBuffer(
      CertificateTemplate({ data: pdfData })
    );

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="preview-${sampleNumber}.pdf"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
