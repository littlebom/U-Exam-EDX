import { prisma } from "@/lib/prisma";
import { errors } from "@/lib/errors";
import type { Prisma } from "@/generated/prisma";
import crypto from "crypto";

// ─── List Certificates ──────────────────────────────────────────────

export async function listCertificates(
  tenantId: string,
  filters: {
    candidateId?: string;
    status?: string;
    page?: number;
    perPage?: number;
  } = {}
) {
  const { candidateId, status, page = 1, perPage = 20 } = filters;

  const where: Record<string, unknown> = { tenantId };
  if (candidateId) where.candidateId = candidateId;
  if (status) where.status = status;

  const [total, certificates] = await Promise.all([
    prisma.certificate.count({ where }),
    prisma.certificate.findMany({
      where,
      include: {
        template: { select: { id: true, name: true } },
        candidate: { select: { id: true, name: true, email: true } },
        grade: {
          select: {
            totalScore: true,
            maxScore: true,
            percentage: true,
            session: {
              select: {
                examSchedule: {
                  select: {
                    exam: { select: { id: true, title: true } },
                  },
                },
              },
            },
          },
        },
        digitalBadge: { select: { id: true, badgeUrl: true } },
      },
      orderBy: { issuedAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
  ]);

  return {
    data: certificates.map((c) => ({
      id: c.id,
      certificateNumber: c.certificateNumber,
      candidateName: c.candidate.name,
      candidateEmail: c.candidate.email,
      examTitle: c.grade.session.examSchedule.exam.title,
      examId: c.grade.session.examSchedule.exam.id,
      score: c.grade.totalScore,
      maxScore: c.grade.maxScore,
      percentage: c.grade.percentage,
      templateName: c.template.name,
      status: c.status,
      issuedAt: c.issuedAt,
      expiresAt: c.expiresAt,
      verificationUrl: c.verificationUrl,
      hasBadge: !!c.digitalBadge,
      badgeUrl: c.digitalBadge?.badgeUrl ?? null,
    })),
    meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) },
  };
}

// ─── Get Certificate Detail ─────────────────────────────────────────

export async function getCertificate(tenantId: string, id: string) {
  const cert = await prisma.certificate.findFirst({
    where: { id, tenantId },
    include: {
      template: true,
      candidate: { select: { id: true, name: true, email: true, imageUrl: true } },
      grade: {
        select: {
          totalScore: true,
          maxScore: true,
          percentage: true,
          isPassed: true,
          gradedAt: true,
          session: {
            select: {
              examSchedule: {
                select: {
                  exam: { select: { id: true, title: true, passingScore: true } },
                  startDate: true,
                },
              },
            },
          },
        },
      },
      digitalBadge: true,
    },
  });

  if (!cert) throw errors.notFound("ไม่พบใบรับรอง");
  return cert;
}

// ─── Issue Certificate ──────────────────────────────────────────────

export async function issueCertificate(
  tenantId: string,
  data: {
    templateId: string;
    candidateId: string;
    gradeId: string;
    expiresAt?: Date;
    metadata?: Record<string, unknown>;
  }
) {
  // Verify grade exists and is passed
  const grade = await prisma.grade.findFirst({
    where: { id: data.gradeId, tenantId, isPassed: true },
    include: {
      session: {
        select: {
          candidateId: true,
          examSchedule: {
            select: { exam: { select: { title: true } } },
          },
        },
      },
    },
  });

  if (!grade) throw errors.notFound("ไม่พบผลสอบที่ผ่านเกณฑ์");
  if (grade.session.candidateId !== data.candidateId) {
    throw errors.validation("ผู้สอบไม่ตรงกับผลสอบ");
  }

  // Check for existing certificate for this grade
  const existing = await prisma.certificate.findFirst({
    where: { gradeId: data.gradeId, status: "ACTIVE" },
  });
  if (existing) {
    throw errors.conflict("มีใบรับรองสำหรับผลสอบนี้แล้ว");
  }

  // Generate certificate number
  const certNumber = generateCertificateNumber(tenantId);

  // Default expires 2 years
  const expiresAt =
    data.expiresAt ?? new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000);

  return prisma.certificate.create({
    data: {
      tenantId,
      templateId: data.templateId,
      candidateId: data.candidateId,
      gradeId: data.gradeId,
      certificateNumber: certNumber,
      issuedAt: new Date(),
      expiresAt,
      verificationUrl: `/verify/${certNumber}`,
      status: "ACTIVE",
      metadata: (data.metadata as Prisma.InputJsonValue) ?? undefined,
    },
    include: {
      template: { select: { id: true, name: true } },
      candidate: { select: { id: true, name: true } },
    },
  });
}

// ─── Revoke Certificate ─────────────────────────────────────────────

export async function revokeCertificate(
  tenantId: string,
  id: string,
  reason: string
) {
  const cert = await prisma.certificate.findFirst({
    where: { id, tenantId },
  });
  if (!cert) throw errors.notFound("ไม่พบใบรับรอง");
  if (cert.status !== "ACTIVE") {
    throw errors.validation("สามารถเพิกถอนได้เฉพาะใบรับรองที่ Active");
  }

  return prisma.certificate.update({
    where: { id },
    data: {
      status: "REVOKED",
      revokedAt: new Date(),
      revokeReason: reason,
    },
  });
}

// ─── Verify Certificate (Public) ────────────────────────────────────

export async function verifyCertificate(certificateNumber: string) {
  const cert = await prisma.certificate.findUnique({
    where: { certificateNumber },
    include: {
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
                  startDate: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!cert) {
    return { valid: false, message: "ไม่พบใบรับรอง" };
  }

  const isExpired = cert.expiresAt && new Date() > cert.expiresAt;

  return {
    valid: cert.status === "ACTIVE" && !isExpired,
    certificateNumber: cert.certificateNumber,
    candidateName: cert.candidate.name,
    examTitle: cert.grade.session.examSchedule.exam.title,
    examDate: cert.grade.session.examSchedule.startDate,
    score: cert.grade.percentage,
    status: isExpired ? "EXPIRED" : cert.status,
    issuedAt: cert.issuedAt,
    expiresAt: cert.expiresAt,
  };
}

// ─── List Candidate Certificates ────────────────────────────────────

export async function listCandidateCertificates(
  candidateId: string,
  filters: { page?: number; perPage?: number } = {}
) {
  const { page = 1, perPage = 20 } = filters;

  const where = { candidateId };

  const [total, certificates] = await Promise.all([
    prisma.certificate.count({ where }),
    prisma.certificate.findMany({
      where,
      include: {
        grade: {
          select: {
            totalScore: true,
            maxScore: true,
            percentage: true,
            session: {
              select: {
                examSchedule: {
                  select: {
                    exam: { select: { id: true, title: true } },
                    startDate: true,
                  },
                },
              },
            },
          },
        },
        digitalBadge: { select: { id: true, badgeUrl: true } },
      },
      orderBy: { issuedAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
  ]);

  return {
    data: certificates.map((c) => ({
      id: c.id,
      certificateNumber: c.certificateNumber,
      examTitle: c.grade.session.examSchedule.exam.title,
      examId: c.grade.session.examSchedule.exam.id,
      examDate: c.grade.session.examSchedule.startDate,
      score: c.grade.totalScore,
      maxScore: c.grade.maxScore,
      percentage: c.grade.percentage,
      status: c.status,
      issuedAt: c.issuedAt,
      expiresAt: c.expiresAt,
      verificationUrl: c.verificationUrl,
      hasBadge: !!c.digitalBadge,
      badgeUrl: c.digitalBadge?.badgeUrl ?? null,
    })),
    meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) },
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────

function generateCertificateNumber(tenantId: string): string {
  const prefix = "CERT";
  const year = new Date().getFullYear();
  const random = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `${prefix}-${year}-${random}`;
}
