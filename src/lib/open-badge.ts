/**
 * Open Badge 3.0 (OB 3.0) Generator
 * Based on 1EdTech Open Badges 3.0 Specification
 * Uses W3C Verifiable Credentials format
 *
 * @see https://1edtech.github.io/openbadges-specification/ob_v3p0.html
 */

// ─── Types ──────────────────────────────────────────────────────────

export interface OpenBadgeCredential {
  "@context": string[];
  id: string;
  type: string[];
  issuer: BadgeIssuer;
  issuanceDate: string;
  expirationDate?: string;
  name: string;
  description?: string;
  credentialSubject: CredentialSubject;
  credentialStatus?: CredentialStatus;
  evidence?: Evidence[];
  proof?: Proof;
}

export interface BadgeIssuer {
  id: string;
  type: string[];
  name: string;
  url?: string;
  image?: string;
  email?: string;
}

export interface CredentialSubject {
  id?: string;
  type: string[];
  name: string;
  achievement: Achievement;
}

export interface Achievement {
  id: string;
  type: string[];
  name: string;
  description?: string;
  criteria: {
    type: string;
    narrative: string;
  };
  image?: string;
  resultDescription?: ResultDescription[];
}

export interface ResultDescription {
  id: string;
  type: string[];
  name: string;
  resultType: string;
  value?: string;
}

export interface CredentialStatus {
  id: string;
  type: string;
}

export interface Evidence {
  id?: string;
  type: string[];
  name?: string;
  narrative?: string;
}

export interface Proof {
  type: string;
  created: string;
  proofPurpose: string;
  verificationMethod: string;
}

// ─── Badge Data Input ───────────────────────────────────────────────

export interface BadgeInput {
  // Certificate info
  certificateId: string;
  certificateNumber: string;
  issuedAt: Date;
  expiresAt?: Date | null;
  status: string;

  // Candidate
  candidateName: string;
  candidateEmail?: string;

  // Exam / Achievement
  examTitle: string;
  examDescription?: string;
  score?: number;
  maxScore?: number;
  percentage?: number;
  isPassed?: boolean;

  // Issuer (Tenant)
  tenantName: string;
  tenantUrl?: string;
  tenantLogoUrl?: string;

  // URLs
  baseUrl: string;
  verificationUrl: string;
}

// ─── Generator ──────────────────────────────────────────────────────

export function generateOpenBadge(input: BadgeInput): OpenBadgeCredential {
  const badgeId = `${input.baseUrl}/api/v1/badges/${input.certificateId}`;
  const issuerId = `${input.baseUrl}/api/v1/badges/issuer`;
  const achievementId = `${input.baseUrl}/api/v1/badges/achievement/${input.certificateNumber}`;

  const credential: OpenBadgeCredential = {
    "@context": [
      "https://www.w3.org/2018/credentials/v1",
      "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json",
      "https://w3id.org/security/suites/ed25519-2020/v1",
    ],
    id: badgeId,
    type: ["VerifiableCredential", "OpenBadgeCredential"],
    issuer: {
      id: issuerId,
      type: ["Profile"],
      name: input.tenantName,
      ...(input.tenantUrl && { url: input.tenantUrl }),
      ...(input.tenantLogoUrl && { image: input.tenantLogoUrl }),
    },
    issuanceDate: input.issuedAt.toISOString(),
    ...(input.expiresAt && {
      expirationDate: input.expiresAt.toISOString(),
    }),
    name: `${input.examTitle} — Certificate`,
    description: input.examDescription
      ? `Certificate for passing ${input.examTitle}. ${input.examDescription}`
      : `Certificate of achievement for successfully passing the ${input.examTitle} examination.`,
    credentialSubject: {
      type: ["AchievementSubject"],
      name: input.candidateName,
      achievement: {
        id: achievementId,
        type: ["Achievement"],
        name: input.examTitle,
        description:
          input.examDescription ??
          `Successfully passed the ${input.examTitle} examination`,
        criteria: {
          type: "Criteria",
          narrative: input.percentage
            ? `Achieved a score of ${input.percentage}% on the ${input.examTitle} examination.`
            : `Successfully completed the ${input.examTitle} examination.`,
        },
        ...(input.percentage !== undefined && {
          resultDescription: [
            {
              id: `${achievementId}/result/score`,
              type: ["ResultDescription"],
              name: "Score",
              resultType: "Result",
              value: `${input.percentage}%`,
            },
            ...(input.score !== undefined && input.maxScore !== undefined
              ? [
                  {
                    id: `${achievementId}/result/raw`,
                    type: ["ResultDescription"] as string[],
                    name: "Raw Score",
                    resultType: "Result",
                    value: `${input.score}/${input.maxScore}`,
                  },
                ]
              : []),
          ],
        }),
      },
    },
    credentialStatus: {
      id: `${input.baseUrl}/api/v1/badges/${input.certificateId}/status`,
      type: "StatusList2021Entry",
    },
    evidence: [
      {
        type: ["Evidence"],
        name: "Examination Result",
        narrative: `Candidate ${input.candidateName} passed ${input.examTitle} with ${input.percentage ?? "a passing"}% score. Certificate Number: ${input.certificateNumber}. Verified at: ${input.baseUrl}${input.verificationUrl}`,
      },
    ],
    proof: {
      type: "Ed25519Signature2020",
      created: input.issuedAt.toISOString(),
      proofPurpose: "assertionMethod",
      verificationMethod: `${issuerId}#key-1`,
    },
  };

  return credential;
}

// ─── Badge Image SVG ────────────────────────────────────────────────

export function generateBadgeSvg(input: {
  examTitle: string;
  tenantName: string;
  certificateNumber: string;
  issuedDate: string;
  primaryColor?: string;
  badgeLabel?: string;
  badgeIcon?: string;
}): string {
  const color = input.primaryColor ?? "#741717";
  const label = input.badgeLabel ?? "CERTIFIED";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${color}88;stop-opacity:1" />
    </linearGradient>
  </defs>
  <circle cx="150" cy="150" r="145" fill="url(#bg)" stroke="${color}" stroke-width="3"/>
  <circle cx="150" cy="150" r="130" fill="none" stroke="white" stroke-width="1" stroke-dasharray="4,4" opacity="0.5"/>
  <text x="150" y="85" text-anchor="middle" fill="white" font-family="Arial,sans-serif" font-size="14" font-weight="bold" opacity="0.9">${escapeXml(label)}</text>
  <line x1="80" y1="95" x2="220" y2="95" stroke="white" stroke-width="1" opacity="0.3"/>
  <foreignObject x="30" y="105" width="240" height="70">
    <div xmlns="http://www.w3.org/1999/xhtml" style="color:white;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;text-align:center;line-height:1.3;overflow:hidden;">${escapeXml(input.examTitle)}</div>
  </foreignObject>
  <text x="150" y="200" text-anchor="middle" fill="white" font-family="Arial,sans-serif" font-size="11" opacity="0.8">${escapeXml(input.tenantName)}</text>
  <text x="150" y="225" text-anchor="middle" fill="white" font-family="Arial,sans-serif" font-size="9" opacity="0.6">${escapeXml(input.certificateNumber)}</text>
  <text x="150" y="245" text-anchor="middle" fill="white" font-family="Arial,sans-serif" font-size="9" opacity="0.6">${escapeXml(input.issuedDate)}</text>
  <polygon points="150,260 140,275 143,275 143,290 157,290 157,275 160,275" fill="white" opacity="0.3"/>
</svg>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
