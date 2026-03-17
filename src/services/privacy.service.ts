import { prisma } from "@/lib/prisma";
import { errors } from "@/lib/errors";
import { encrypt, decrypt, isEncrypted, maskNationalId } from "@/lib/encryption";

// ─── Default Privacy Settings ────────────────────────────────────────

const DEFAULT_PRIVACY: PrivacySettings = {
  showEmail: false,
  showPhone: false,
  showResults: true,
  showCertificates: true,
  showInstitution: true,
};

type PrivacySettings = {
  showEmail: boolean;
  showPhone: boolean;
  showResults: boolean;
  showCertificates: boolean;
  showInstitution: boolean;
};

// ─── Get or Create Profile ───────────────────────────────────────────

export async function getOrCreateProfile(userId: string) {
  let profile = await prisma.candidateProfile.findUnique({
    where: { userId },
    include: {
      educations: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!profile) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    profile = await prisma.candidateProfile.create({
      data: {
        userId,
        displayName: user?.name ?? null,
        privacySettings: DEFAULT_PRIVACY,
      },
      include: {
        educations: { orderBy: { sortOrder: "asc" } },
      },
    });
  }

  return profile;
}

// ─── Get Privacy Settings ────────────────────────────────────────────

export async function getPrivacySettings(userId: string): Promise<PrivacySettings> {
  const profile = await getOrCreateProfile(userId);
  const settings = profile.privacySettings as Record<string, unknown> | null;

  return {
    showEmail: (settings?.showEmail as boolean) ?? DEFAULT_PRIVACY.showEmail,
    showPhone: (settings?.showPhone as boolean) ?? DEFAULT_PRIVACY.showPhone,
    showResults: (settings?.showResults as boolean) ?? DEFAULT_PRIVACY.showResults,
    showCertificates: (settings?.showCertificates as boolean) ?? DEFAULT_PRIVACY.showCertificates,
    showInstitution: (settings?.showInstitution as boolean) ?? DEFAULT_PRIVACY.showInstitution,
  };
}

// ─── Update Privacy Settings ─────────────────────────────────────────

export async function updatePrivacySettings(
  userId: string,
  settings: Partial<PrivacySettings>
) {
  const current = await getPrivacySettings(userId);
  const updated = { ...current, ...settings };

  return prisma.candidateProfile.update({
    where: { userId },
    data: { privacySettings: updated },
  });
}

// ─── Update Profile ──────────────────────────────────────────────────

interface EducationInput {
  id?: string;
  educationLevel: string;
  institution: string;
  faculty?: string;
  major?: string;
  graduationYear?: number | null;
  sortOrder?: number;
}

export async function updateCandidateProfile(
  userId: string,
  data: {
    displayName?: string;
    institution?: string;
    bio?: string;
    avatarUrl?: string;
    publicProfileUrl?: string;
    isPublic?: boolean;
    // Personal Info
    phone?: string;
    dateOfBirth?: string; // ISO date string
    gender?: string;
    nationalId?: string;
    address?: string;
    // Education (legacy flat fields — kept for backward compat)
    educationLevel?: string;
    faculty?: string;
    major?: string;
    graduationYear?: number;
    // Education (new multi-record)
    educations?: EducationInput[];
  }
) {
  // Ensure profile exists
  const profile = await getOrCreateProfile(userId);

  // If publicProfileUrl is provided, check uniqueness
  if (data.publicProfileUrl) {
    const existing = await prisma.candidateProfile.findUnique({
      where: { publicProfileUrl: data.publicProfileUrl },
    });
    if (existing && existing.userId !== userId) {
      throw errors.conflict("URL โปรไฟล์นี้ถูกใช้แล้ว");
    }
  }

  // Separate User-level fields from CandidateProfile fields
  const userUpdate: Record<string, unknown> = {};
  if (data.displayName) userUpdate.name = data.displayName;
  if (data.phone !== undefined) userUpdate.phone = data.phone || null;

  if (Object.keys(userUpdate).length > 0) {
    await prisma.user.update({
      where: { id: userId },
      data: userUpdate,
    });
  }

  // Build CandidateProfile update (exclude User-level + education array fields)
  const { phone: _phone, educations: _educations, ...profileData } = data;

  // Convert dateOfBirth string to Date object
  const profileUpdate: Record<string, unknown> = { ...profileData };
  if (profileData.dateOfBirth) {
    profileUpdate.dateOfBirth = new Date(profileData.dateOfBirth);
  }

  // Encrypt nationalId before storing
  if (profileData.nationalId) {
    profileUpdate.nationalId = encrypt(profileData.nationalId);
  }

  // Update profile + educations in a transaction
  return prisma.$transaction(async (tx) => {
    const updatedProfile = await tx.candidateProfile.update({
      where: { userId },
      data: profileUpdate,
    });

    // Handle education records if provided
    if (data.educations !== undefined) {
      const incomingIds = data.educations
        .map((e) => e.id)
        .filter((id): id is string => !!id);

      // Delete records that are no longer in the list
      await tx.education.deleteMany({
        where: {
          profileId: profile.id,
          ...(incomingIds.length > 0
            ? { id: { notIn: incomingIds } }
            : {}),
        },
      });

      // Upsert each education record
      for (let i = 0; i < data.educations.length; i++) {
        const edu = data.educations[i];
        const eduData = {
          educationLevel: edu.educationLevel,
          institution: edu.institution,
          faculty: edu.faculty || null,
          major: edu.major || null,
          graduationYear: edu.graduationYear || null,
          sortOrder: edu.sortOrder ?? i,
        };

        if (edu.id) {
          await tx.education.update({
            where: { id: edu.id },
            data: eduData,
          });
        } else {
          await tx.education.create({
            data: {
              ...eduData,
              profileId: profile.id,
            },
          });
        }
      }
    }

    return updatedProfile;
  });
}

// ─── Decrypt & Mask National ID ─────────────────────────────────────

/**
 * Decrypt nationalId from DB and return masked version for display.
 * Returns null if no nationalId stored.
 */
export function getMaskedNationalId(encryptedNationalId: string | null): string | null {
  if (!encryptedNationalId) return null;

  try {
    // Handle both encrypted and legacy plain-text values
    if (isEncrypted(encryptedNationalId)) {
      const plain = decrypt(encryptedNationalId);
      return maskNationalId(plain);
    }
    // Legacy unencrypted value — mask directly
    return maskNationalId(encryptedNationalId);
  } catch {
    // If decryption fails, return generic mask
    return "●●●●●●●●●●●●●";
  }
}

// ─── Get Public Profile ──────────────────────────────────────────────

export async function getPublicProfile(profileUrl: string) {
  const profile = await prisma.candidateProfile.findUnique({
    where: { publicProfileUrl: profileUrl },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          imageUrl: true,
        },
      },
      educations: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!profile || !profile.isPublic) {
    throw errors.notFound("ไม่พบโปรไฟล์");
  }

  const privacy = profile.privacySettings as Record<string, unknown> | null;

  // Apply privacy settings
  return {
    displayName: profile.displayName ?? profile.user.name,
    institution: privacy?.showInstitution ? profile.institution : null,
    educations: privacy?.showInstitution ? profile.educations : [],
    bio: profile.bio,
    avatarUrl: profile.avatarUrl ?? profile.user.imageUrl,
    email: privacy?.showEmail ? profile.user.email : null,
    phone: privacy?.showPhone ? profile.user.phone : null,
    userId: profile.user.id,
    showResults: privacy?.showResults ?? true,
    showCertificates: privacy?.showCertificates ?? true,
  };
}

// ─── Check Visibility ────────────────────────────────────────────────

export async function checkFieldVisibility(
  userId: string,
  field: keyof PrivacySettings
): Promise<boolean> {
  const settings = await getPrivacySettings(userId);
  return settings[field] ?? false;
}
