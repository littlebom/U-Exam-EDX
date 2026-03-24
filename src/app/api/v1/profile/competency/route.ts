import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, errors } from "@/lib/errors";

// GET /api/v1/profile/competency?frameworkId=xxx
// คำนวณ competency score:
//   1. ถ้าวิชามี SubjectCompetencyMap (weight) → ใช้ weight × คะแนนรวมวิชา
//   2. ถ้าข้อสอบมี QuestionCompetencyMap → ใช้คะแนนรายข้อ (fallback)

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) throw errors.unauthorized();

    const userId = session.user.id;
    const frameworkId = req.nextUrl.searchParams.get("frameworkId");

    // Get user's tenant for isolation — require tenant
    const userTenant = await prisma.userTenant.findFirst({
      where: { userId },
      select: { tenantId: true },
    });
    if (!userTenant) {
      return NextResponse.json({
        success: true,
        data: { frameworks: [] },
      });
    }
    const tenantId = userTenant.tenantId;

    if (!frameworkId) {
      // Return frameworks ที่ user มีผลสอบ หรือมี SubjectCompetencyMap
      // 1. Frameworks from exams user took
      const fromExams = await prisma.competencyFramework.findMany({
        where: {
          tenantId,
          exams: {
            some: {
              schedules: {
                some: {
                  examSessions: {
                    some: { candidateId: userId },
                  },
                },
              },
            },
          },
        },
        select: {
          id: true, name: true, description: true,
          areas: { orderBy: { order: "asc" }, select: { id: true, name: true, color: true } },
        },
      });

      // 2. Frameworks that have subject competency maps
      const fromSubjects = await prisma.competencyFramework.findMany({
        where: {
          tenantId,
          areas: {
            some: {
              subjectMaps: { some: {} },
            },
          },
        },
        select: {
          id: true, name: true, description: true,
          areas: { orderBy: { order: "asc" }, select: { id: true, name: true, color: true } },
        },
      });

      // Merge & dedupe
      const map = new Map<string, typeof fromExams[0]>();
      [...fromExams, ...fromSubjects].forEach((fw) => map.set(fw.id, fw));
      const frameworks = Array.from(map.values());

      return NextResponse.json({ success: true, data: { frameworks } });
    }

    // Get framework with areas
    const framework = await prisma.competencyFramework.findFirst({
      where: { id: frameworkId, ...(tenantId && { tenantId }) },
      include: { areas: { orderBy: { order: "asc" } } },
    });

    if (!framework) throw errors.notFound("ไม่พบกรอบสมรรถนะ");

    // Init area scores
    const areaScores: Record<string, { score: number; maxScore: number; count: number }> = {};
    for (const area of framework.areas) {
      areaScores[area.id] = { score: 0, maxScore: 0, count: 0 };
    }

    // Strategy B: SubjectCompetencyMap (weight × grade percentage)
    const subjectMaps = await prisma.subjectCompetencyMap.findMany({
      where: {
        competencyArea: { frameworkId },
        weight: { gt: 0 },
      },
      select: {
        competencyAreaId: true,
        weight: true,
        subjectId: true,
      },
    });

    // SubjectCompetencyMap — weight × grade percentage
    const subjectIds = [...new Set(subjectMaps.map((m) => m.subjectId))];

    if (subjectIds.length > 0) {
      // Get grades for exams that have blueprints linked to these subjects
      const grades = await prisma.grade.findMany({
        where: {
          session: {
            candidateId: userId,
            status: { in: ["SUBMITTED", "TIMED_OUT"] },
            examSchedule: {
              exam: {
                blueprints: {
                  some: { subjectId: { in: subjectIds } },
                },
              },
            },
          },
          status: "PUBLISHED",
        },
        select: {
          percentage: true,
          totalScore: true,
          maxScore: true,
          session: {
            select: {
              examSchedule: {
                select: {
                  exam: {
                    select: {
                      blueprints: {
                        where: { subjectId: { in: subjectIds } },
                        select: { subjectId: true },
                        take: 1,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { publishedAt: "desc" },
      });

      // Best grade per subject
      const bestGradeBySubject: Record<string, number> = {};
      for (const g of grades) {
        const sid = g.session.examSchedule.exam.blueprints[0]?.subjectId;
        if (!sid) continue;
        const pct = (g.percentage && g.percentage > 0)
          ? g.percentage
          : (g.maxScore > 0 ? (g.totalScore / g.maxScore) * 100 : 0);
        if (!(sid in bestGradeBySubject) || pct > bestGradeBySubject[sid]) {
          bestGradeBySubject[sid] = pct;
        }
      }

      // Calculate weighted scores
      for (const m of subjectMaps) {
        const pct = bestGradeBySubject[m.subjectId];
        if (pct === undefined) continue;

        if (areaScores[m.competencyAreaId]) {
          const weightedScore = pct * m.weight;
          const weightedMax = 100 * m.weight;
          areaScores[m.competencyAreaId].score += weightedScore;
          areaScores[m.competencyAreaId].maxScore += weightedMax;
          areaScores[m.competencyAreaId].count += 1;
        }
      }
    }

    // Build response
    const competencies = framework.areas.map((area) => {
      const s = areaScores[area.id];
      const percentage = s.maxScore > 0 ? Math.round((s.score / s.maxScore) * 100) : 0;
      return {
        id: area.id,
        name: area.name,
        color: area.color,
        score: Math.round(s.score * 10) / 10,
        maxScore: Math.round(s.maxScore * 10) / 10,
        percentage,
        questionCount: s.count,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        framework: { id: framework.id, name: framework.name, description: framework.description },
        competencies,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
