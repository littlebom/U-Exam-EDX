import { NextRequest, NextResponse } from "next/server";
import { getProfileDashboard, getRecentResults } from "@/services/profile.service";
import { updateCandidateProfile, getOrCreateProfile, getMaskedNationalId } from "@/services/privacy.service";
import { handleApiError } from "@/lib/errors";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { message: "กรุณาเข้าสู่ระบบ" } },
        { status: 401 }
      );
    }

    const [dashboard, recentResults, profile, certificates] = await Promise.all([
      getProfileDashboard(session.user.id),
      getRecentResults(session.user.id),
      getOrCreateProfile(session.user.id),
      prisma.certificate.findMany({
        where: { candidateId: session.user.id, status: "ACTIVE" },
        orderBy: { issuedAt: "desc" },
        take: 3,
        select: {
          id: true,
          certificateNumber: true,
          issuedAt: true,
          grade: {
            select: {
              session: {
                select: {
                  examSchedule: {
                    select: { exam: { select: { title: true } } },
                  },
                },
              },
            },
          },
          digitalBadge: { select: { id: true, badgeUrl: true } },
        },
      }),
    ]);

    // Decrypt & mask nationalId for security — only return last 4 digits
    const maskedProfile = {
      ...profile,
      nationalId: getMaskedNationalId(profile.nationalId),
      // Convert dateOfBirth to ISO string for frontend
      dateOfBirth: profile.dateOfBirth
        ? profile.dateOfBirth.toISOString().split("T")[0]
        : null,
    };

    return NextResponse.json({
      success: true,
      data: { ...dashboard, recentResults, profile: maskedProfile, certificates },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

const EDUCATION_LEVELS = [
  "secondary", "vocational_cert", "high_vocational",
  "bachelor", "master", "doctorate",
] as const;

const educationItemSchema = z.object({
  id: z.string().uuid().optional(),
  educationLevel: z.enum(EDUCATION_LEVELS),
  institution: z.string().min(1).max(255),
  faculty: z.string().max(255).optional().or(z.literal("")),
  major: z.string().max(255).optional().or(z.literal("")),
  graduationYear: z.number().int().min(1950).max(2100).optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
});

const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(255).optional(),
  institution: z.string().max(255).optional(),
  bio: z.string().max(1000).optional(),
  avatarUrl: z.string().url().max(500).optional(),
  publicProfileUrl: z.string().min(3).max(100).regex(/^[a-z0-9_-]+$/).optional(),
  isPublic: z.boolean().optional(),
  // Personal Info
  phone: z.string().max(20).optional(),
  dateOfBirth: z.string().optional(), // ISO date string "YYYY-MM-DD"
  gender: z.enum(["male", "female", "unspecified"]).optional(),
  nationalId: z.string().max(20).optional(),
  address: z.string().max(1000).optional(),
  // Education (legacy flat fields — kept for backward compat)
  educationLevel: z.enum(EDUCATION_LEVELS).optional(),
  faculty: z.string().max(255).optional(),
  major: z.string().max(255).optional(),
  graduationYear: z.number().int().min(1950).max(2100).optional(),
  // Education (new multi-record)
  educations: z.array(educationItemSchema).max(10).optional(),
});

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { message: "กรุณาเข้าสู่ระบบ" } },
        { status: 401 }
      );
    }

    const body = await req.json();
    const data = updateProfileSchema.parse(body);
    const result = await updateCandidateProfile(session.user.id, data);

    // Fire-and-forget audit log
    import("@/services/audit-log.service").then(({ logAudit }) =>
      logAudit({
        action: "PROFILE_UPDATE",
        category: "USER",
        userId: session.user!.id,
        target: session.user!.id,
        detail: { fields: Object.keys(data) },
      })
    ).catch(() => {});

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error);
  }
}
