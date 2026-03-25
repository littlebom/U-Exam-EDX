/**
 * Auto-award badges based on BadgeTemplate criteria
 * Called when a grade is confirmed/published
 */

import { prisma } from "@/lib/prisma";

export async function autoAwardBadges(gradeId: string) {
  const grade = await prisma.grade.findUnique({
    where: { id: gradeId },
    select: {
      id: true,
      tenantId: true,
      percentage: true,
      isPassed: true,
      session: {
        select: {
          candidateId: true,
          examSchedule: { select: { examId: true } },
        },
      },
    },
  });

  if (!grade || !grade.isPassed || grade.percentage === null) return [];

  const candidateId = grade.session.candidateId;
  const examId = grade.session.examSchedule.examId;
  const percentage = grade.percentage;

  // Find matching badge templates (specific exam OR global)
  const templates = await prisma.badgeTemplate.findMany({
    where: {
      tenantId: grade.tenantId,
      isActive: true,
      minScore: { lte: percentage },
      maxScore: { gte: percentage },
      OR: [
        { examId: examId },
        { examId: null }, // global templates
      ],
    },
    orderBy: { priority: "desc" },
  });

  if (templates.length === 0) return [];

  // Award the highest priority badge (avoid duplicates)
  const bestTemplate = templates[0];

  // Check if already awarded for this grade + template
  const existing = await prisma.digitalBadge.findFirst({
    where: {
      gradeId: gradeId,
      badgeTemplateId: bestTemplate.id,
    },
  });

  if (existing) return [existing];

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://u-exam.com";

  const badge = await prisma.digitalBadge.create({
    data: {
      badgeTemplateId: bestTemplate.id,
      gradeId: gradeId,
      userId: candidateId,
      badgeUrl: `${baseUrl}/api/v1/badges/template/${bestTemplate.id}`,
      metadata: {
        templateName: bestTemplate.name,
        templateColor: bestTemplate.badgeColor,
        templateIcon: bestTemplate.badgeIcon,
        templateLabel: bestTemplate.badgeLabel,
        percentage,
        examId,
        awardedAt: new Date().toISOString(),
      },
    },
  });

  // Fire-and-forget audit log
  import("@/services/audit-log.service").then(({ logAudit }) =>
    logAudit({
      action: "BADGE_AWARDED",
      category: "SYSTEM",
      userId: candidateId,
      tenantId: grade.tenantId,
      target: badge.id,
      detail: {
        templateId: bestTemplate.id,
        templateName: bestTemplate.name,
        gradeId,
        examId,
        percentage,
      },
    })
  ).catch(() => {});

  return [badge];
}
