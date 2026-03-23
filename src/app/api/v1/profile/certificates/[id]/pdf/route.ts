import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { auth } from "@/lib/auth";
import { handleApiError, errors } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import {
  CertificateTemplate,
  type CertificatePdfData,
} from "@/lib/pdf/certificate-template";
import QRCode from "qrcode";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { message: "กรุณาเข้าสู่ระบบ" } },
        { status: 401 }
      );
    }

    const { id } = await params;

    const cert = await prisma.certificate.findFirst({
      where: { id, candidateId: session.user.id },
      include: {
        template: { select: { name: true, design: true } },
        candidate: { select: { name: true } },
        grade: {
          select: {
            totalScore: true,
            maxScore: true,
            percentage: true,
            session: {
              select: {
                examSchedule: {
                  select: {
                    exam: { select: { title: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!cert) throw errors.notFound("ไม่พบใบรับรอง");

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const verifyUrl = `${appUrl}/verify/certificate/${cert.certificateNumber}`;
    const qrCodeDataUrl = await QRCode.toDataURL(verifyUrl, {
      width: 200,
      margin: 1,
    });

    const design = (cert.template.design as Record<string, unknown>) ?? {};
    const resolveUrl = (u: string | null | undefined) =>
      u && u.startsWith("/") ? `${appUrl}${u}` : u ?? null;

    const rawSigs = (design.signatories as Array<{ name: string; title: string; signatureUrl?: string }>) ?? [];
    const resolvedSigs = rawSigs.map((s) => ({
      ...s,
      signatureUrl: resolveUrl(s.signatureUrl),
    }));

    const pdfData: CertificatePdfData = {
      certificateNumber: cert.certificateNumber,
      candidateName: cert.candidate.name ?? "Unknown",
      examTitle: cert.grade.session.examSchedule.exam.title,
      score: cert.grade.totalScore,
      maxScore: cert.grade.maxScore,
      percentage: cert.grade.percentage,
      issuedAt: cert.issuedAt.toISOString(),
      expiresAt: cert.expiresAt?.toISOString() ?? null,
      templateName: cert.template.name,
      qrCodeDataUrl,
      logoUrl: resolveUrl(design.logoUrl as string | undefined),
      primaryColor: (design.primaryColor as string) ?? undefined,
      background: (design.background as string) ?? undefined,
      backgroundUrl: resolveUrl(design.backgroundUrl as string | undefined),
      signatories: resolvedSigs,
    };

    const buffer = await renderToBuffer(
      CertificateTemplate({ data: pdfData })
    );

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${cert.certificateNumber}.pdf"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
