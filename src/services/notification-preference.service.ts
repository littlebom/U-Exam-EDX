import { prisma } from "@/lib/prisma";

// All supported notification types
export const NOTIFICATION_TYPES = [
  { type: "RESULT_PUBLISHED", label: "ผลสอบ", description: "แจ้งเมื่อผลสอบเผยแพร่" },
  { type: "CERTIFICATE_ISSUED", label: "ใบรับรอง", description: "แจ้งเมื่อได้รับใบรับรอง" },
  { type: "PAYMENT_COMPLETED", label: "การชำระเงิน", description: "แจ้งเมื่อชำระเงินสำเร็จ" },
  { type: "REFUND_PROCESSED", label: "คืนเงิน", description: "แจ้งเมื่อคืนเงินสำเร็จ" },
  { type: "EXAM_SUBMITTED", label: "ส่งข้อสอบ", description: "แจ้งเมื่อส่งข้อสอบแล้ว" },
  { type: "EXAM_REMINDER", label: "เตือนสอบ", description: "แจ้งเตือนก่อนวันสอบ" },
  { type: "REGISTRATION_APPROVED", label: "สมัครสอบ", description: "แจ้งเมื่อสมัครสอบได้รับอนุมัติ" },
  { type: "SYSTEM_ANNOUNCEMENT", label: "ประกาศ", description: "ประกาศจากระบบ" },
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number]["type"];

interface PreferenceItem {
  type: string;
  label: string;
  description: string;
  inApp: boolean;
  email: boolean;
}

// ─── Get Preferences ────────────────────────────────────────────────

export async function getPreferences(userId: string): Promise<PreferenceItem[]> {
  const saved = await prisma.notificationPreference.findMany({
    where: { userId },
  });

  const savedMap = new Map(saved.map((p) => [p.type, p]));

  return NOTIFICATION_TYPES.map((nt) => {
    const pref = savedMap.get(nt.type);
    return {
      type: nt.type,
      label: nt.label,
      description: nt.description,
      inApp: pref?.inApp ?? true,
      email: pref?.email ?? true,
    };
  });
}

// ─── Update Single Preference ───────────────────────────────────────

export async function updatePreference(
  userId: string,
  type: string,
  data: { inApp?: boolean; email?: boolean }
) {
  return prisma.notificationPreference.upsert({
    where: { userId_type: { userId, type } },
    create: {
      userId,
      type,
      inApp: data.inApp ?? true,
      email: data.email ?? true,
      push: false,
    },
    update: {
      ...(data.inApp !== undefined && { inApp: data.inApp }),
      ...(data.email !== undefined && { email: data.email }),
    },
  });
}

// ─── Check if channel is enabled for a type ─────────────────────────

export async function isChannelEnabled(
  userId: string,
  type: string,
  channel: "inApp" | "email"
): Promise<boolean> {
  const pref = await prisma.notificationPreference.findUnique({
    where: { userId_type: { userId, type } },
  });
  // Default: all channels enabled
  if (!pref) return true;
  return pref[channel];
}
