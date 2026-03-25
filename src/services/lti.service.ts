/**
 * LTI 1.3 Service — Account Linking + Score Passback
 *
 * Flow:
 * 1. edX sends OIDC login → handleOidcLogin() → redirect back to edX
 * 2. edX sends id_token → validateLaunch() → linkOrMatchUser() → storeLineitem()
 * 3. Grade published → passbackScore() → score sent to edX AGS
 */

import * as jose from "jose";
import { prisma } from "@/lib/prisma";
import { encryptSecret, decryptSecret } from "@/lib/crypto";
import { hashPassword } from "@/lib/auth-utils";
import crypto from "crypto";

// ─── Types ──────────────────────────────────────────────────────────

interface LtiLaunchClaims {
  iss: string; // issuer (edX URL)
  sub: string; // user id in edX
  aud: string; // client_id
  exp: number;
  iat: number;
  nonce: string;
  name?: string;
  email?: string;
  given_name?: string;
  family_name?: string;
  "https://purl.imsglobal.org/spec/lti/claim/message_type"?: string;
  "https://purl.imsglobal.org/spec/lti/claim/version"?: string;
  "https://purl.imsglobal.org/spec/lti/claim/deployment_id"?: string;
  "https://purl.imsglobal.org/spec/lti/claim/resource_link"?: {
    id: string;
    title?: string;
  };
  "https://purl.imsglobal.org/spec/lti/claim/context"?: {
    id: string;
    title?: string;
    label?: string;
  };
  "https://purl.imsglobal.org/spec/lti/claim/roles"?: string[];
  "https://purl.imsglobal.org/spec/lti-ags/claim/endpoint"?: {
    scope: string[];
    lineitems?: string;
    lineitem?: string;
  };
}

interface OidcLoginParams {
  iss: string;
  login_hint: string;
  target_link_uri: string;
  lti_message_hint?: string;
  client_id?: string;
}

// ─── Key Pair Generation ────────────────────────────────────────────

export async function generateLtiKeyPair(): Promise<{
  publicKey: string;
  privateKey: string;
}> {
  const { publicKey, privateKey } = await jose.generateKeyPair("RS256", {
    modulusLength: 2048,
  });

  const publicPem = await jose.exportSPKI(publicKey);
  const privatePem = await jose.exportPKCS8(privateKey);

  return {
    publicKey: publicPem,
    privateKey: encryptSecret(privatePem),
  };
}

// ─── JWKS ───────────────────────────────────────────────────────────

export async function getLtiJwks(platformId: string) {
  const platform = await prisma.ltiPlatform.findUnique({
    where: { id: platformId },
    select: { publicKey: true, id: true },
  });

  if (!platform) throw new Error("Platform not found");

  const publicKey = await jose.importSPKI(platform.publicKey, "RS256");
  const jwk = await jose.exportJWK(publicKey);

  return {
    keys: [
      {
        ...jwk,
        kid: platform.id,
        alg: "RS256",
        use: "sig",
      },
    ],
  };
}

// ─── OIDC Login ─────────────────────────────────────────────────────

export function handleOidcLogin(
  params: OidcLoginParams,
  platform: {
    id: string;
    clientId: string;
    authLoginUrl: string;
  },
  launchUrl: string
): string {
  const state = crypto.randomUUID();
  const nonce = crypto.randomUUID();

  // Build auth request URL
  const authUrl = new URL(platform.authLoginUrl);
  authUrl.searchParams.set("scope", "openid");
  authUrl.searchParams.set("response_type", "id_token");
  authUrl.searchParams.set("response_mode", "form_post");
  authUrl.searchParams.set("client_id", platform.clientId);
  authUrl.searchParams.set("redirect_uri", launchUrl);
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("nonce", nonce);
  authUrl.searchParams.set("login_hint", params.login_hint);
  if (params.lti_message_hint) {
    authUrl.searchParams.set("lti_message_hint", params.lti_message_hint);
  }
  authUrl.searchParams.set("prompt", "none");

  return authUrl.toString();
}

// ─── Validate Launch ────────────────────────────────────────────────

export async function validateLtiLaunch(
  idToken: string,
  platform: {
    id: string;
    clientId: string;
    deploymentId: string;
    jwksUrl: string;
    issuer: string;
  }
): Promise<LtiLaunchClaims> {
  // Fetch edX public keys
  const jwks = jose.createRemoteJWKSet(new URL(platform.jwksUrl));

  // Verify JWT
  const { payload } = await jose.jwtVerify(idToken, jwks, {
    issuer: platform.issuer,
    audience: platform.clientId,
  });

  const claims = payload as unknown as LtiLaunchClaims;

  // Verify deployment ID
  const deploymentId =
    claims["https://purl.imsglobal.org/spec/lti/claim/deployment_id"];
  if (deploymentId && deploymentId !== platform.deploymentId) {
    throw new Error("Deployment ID mismatch");
  }

  // Verify message type
  const messageType =
    claims["https://purl.imsglobal.org/spec/lti/claim/message_type"];
  if (messageType !== "LtiResourceLinkRequest") {
    throw new Error(`Unsupported message type: ${messageType}`);
  }

  return claims;
}

// ─── Link or Match User ─────────────────────────────────────────────

export async function linkOrMatchUser(
  platformId: string,
  claims: LtiLaunchClaims,
  tenantId: string
): Promise<{ userId: string; isNewUser: boolean; isNewLink: boolean }> {
  const ltiUserId = claims.sub;
  const email = claims.email;
  const name =
    claims.name ||
    [claims.given_name, claims.family_name].filter(Boolean).join(" ") ||
    email ||
    "LTI User";

  const resourceLink =
    claims["https://purl.imsglobal.org/spec/lti/claim/resource_link"];
  const context =
    claims["https://purl.imsglobal.org/spec/lti/claim/context"];
  const agsEndpoint =
    claims["https://purl.imsglobal.org/spec/lti-ags/claim/endpoint"];

  // 1. Find course mapping by contextId or resourceLinkId
  const courseMapping = await findCourseMapping(
    platformId,
    context?.id ?? null,
    resourceLink?.id ?? null
  );

  // 2. ตรวจว่า link มีอยู่แล้วหรือไม่ (scoped to courseMappingId)
  const courseMappingId = courseMapping?.id ?? null;
  const existingLink = await prisma.ltiUserLink.findFirst({
    where: {
      platformId,
      ltiUserId,
      courseMappingId,
    },
    select: { userId: true },
  });

  if (existingLink) {
    return { userId: existingLink.userId, isNewUser: false, isNewLink: false };
  }

  // 3. ถ้ายังไม่มี link → หา user ตาม email
  let userId: string | null = null;
  let isNewUser = false;

  if (email) {
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existingUser) {
      userId = existingUser.id;
    }
  }

  // 4. ถ้าไม่พบ user → สร้างใหม่
  if (!userId) {
    const randomPassword = crypto.randomBytes(32).toString("hex");
    const newUser = await prisma.user.create({
      data: {
        email: email || `lti_${ltiUserId}@u-exam.local`,
        name,
        password: await hashPassword(randomPassword),
        isActive: true,
      },
    });
    userId = newUser.id;
    isNewUser = true;

    // Assign CANDIDATE role + tenant
    const candidateRole = await prisma.role.findFirst({
      where: { name: "CANDIDATE" },
    });
    if (candidateRole) {
      await prisma.userTenant.create({
        data: {
          userId: newUser.id,
          tenantId,
          roleId: candidateRole.id,
        },
      });
    }
  }

  // 5. สร้าง link (with courseMappingId if found)
  await prisma.ltiUserLink.create({
    data: {
      platformId,
      userId,
      ltiUserId,
      ltiEmail: email,
      ltiName: name,
      lineitemUrl: agsEndpoint?.lineitem ?? null,
      resourceLinkId: resourceLink?.id ?? null,
      contextId: context?.id ?? null,
      contextTitle: context?.title ?? null,
      courseMappingId,
    },
  });

  return { userId, isNewUser, isNewLink: true };
}

// ─── Update Lineitem ────────────────────────────────────────────────

export async function updateLineitem(
  platformId: string,
  ltiUserId: string,
  claims: LtiLaunchClaims
) {
  const agsEndpoint =
    claims["https://purl.imsglobal.org/spec/lti-ags/claim/endpoint"];
  const resourceLink =
    claims["https://purl.imsglobal.org/spec/lti/claim/resource_link"];
  const context =
    claims["https://purl.imsglobal.org/spec/lti/claim/context"];

  if (agsEndpoint?.lineitem) {
    // Find course mapping for this context/resource
    const courseMapping = await findCourseMapping(
      platformId,
      context?.id ?? null,
      resourceLink?.id ?? null
    );

    const link = await prisma.ltiUserLink.findFirst({
      where: {
        platformId,
        ltiUserId,
        courseMappingId: courseMapping?.id ?? null,
      },
      select: { id: true },
    });

    if (link) {
      await prisma.ltiUserLink.update({
        where: { id: link.id },
        data: {
          lineitemUrl: agsEndpoint.lineitem,
          resourceLinkId: resourceLink?.id,
          contextId: context?.id,
          contextTitle: context?.title,
          ltiName:
            claims.name ||
            [claims.given_name, claims.family_name].filter(Boolean).join(" ") ||
            undefined,
          ltiEmail: claims.email || undefined,
        },
      });
    }
  }
}

// ─── Find Course Mapping ────────────────────────────────────────────

async function findCourseMapping(
  platformId: string,
  contextId: string | null,
  resourceLinkId: string | null
) {
  if (!contextId && !resourceLinkId) return null;

  // Try contextId first, then resourceLinkId
  const where = [];
  if (contextId) {
    where.push({ platformId, contextId, isActive: true });
  }
  if (resourceLinkId) {
    where.push({ platformId, resourceLinkId, isActive: true });
  }

  return prisma.ltiCourseMapping.findFirst({
    where: { OR: where },
    select: { id: true, examId: true },
  });
}

// ─── Score Passback (AGS) ───────────────────────────────────────────

export async function passbackScore(
  userId: string,
  examId: string,
  score: number,
  maxScore: number
): Promise<{ success: boolean; platformName?: string; error?: string }> {
  // Find user's LTI link with lineitem — prefer course-specific link for this exam
  const link = await prisma.ltiUserLink.findFirst({
    where: {
      userId,
      lineitemUrl: { not: null },
      platform: { isActive: true },
      courseMapping: { examId },
    },
    include: {
      platform: {
        select: {
          id: true,
          name: true,
          clientId: true,
          authTokenUrl: true,
          privateKey: true,
        },
      },
    },
  }) ?? await prisma.ltiUserLink.findFirst({
    // Fallback: generic link (no courseMapping)
    where: {
      userId,
      lineitemUrl: { not: null },
      platform: { isActive: true },
      courseMappingId: null,
    },
    include: {
      platform: {
        select: {
          id: true,
          name: true,
          clientId: true,
          authTokenUrl: true,
          privateKey: true,
        },
      },
    },
  });

  if (!link || !link.lineitemUrl) {
    return { success: false, error: "No LTI link with lineitem found" };
  }

  try {
    // 1. Get access token from edX
    const privateKeyPem = decryptSecret(link.platform.privateKey);
    const privateKey = await jose.importPKCS8(privateKeyPem, "RS256");

    const jwt = await new jose.SignJWT({
      sub: link.platform.clientId,
      iss: link.platform.clientId,
    })
      .setProtectedHeader({ alg: "RS256", kid: link.platform.id })
      .setAudience(link.platform.authTokenUrl)
      .setIssuedAt()
      .setExpirationTime("5m")
      .setJti(crypto.randomUUID())
      .sign(privateKey);

    const tokenResponse = await fetch(link.platform.authTokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_assertion_type:
          "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
        client_assertion: jwt,
        scope:
          "https://purl.imsglobal.org/spec/lti-ags/scope/lineitem https://purl.imsglobal.org/spec/lti-ags/scope/score",
      }),
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      throw new Error(`Token request failed: ${tokenResponse.status} ${errText}`);
    }

    const tokenData = (await tokenResponse.json()) as { access_token: string };

    // 2. Send score to edX
    const scoreUrl = `${link.lineitemUrl}/scores`;
    const scorePayload = {
      userId: link.ltiUserId,
      scoreGiven: score,
      scoreMaximum: maxScore,
      activityProgress: "Completed",
      gradingProgress: "FullyGraded",
      timestamp: new Date().toISOString(),
    };

    const scoreResponse = await fetch(scoreUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        "Content-Type": "application/vnd.ims.lis.v1.score+json",
      },
      body: JSON.stringify(scorePayload),
    });

    if (!scoreResponse.ok) {
      const errText = await scoreResponse.text();
      throw new Error(`Score passback failed: ${scoreResponse.status} ${errText}`);
    }

    // 3. Log success
    await prisma.ltiLaunchLog.create({
      data: {
        platformId: link.platform.id,
        userId,
        ltiUserId: link.ltiUserId,
        action: "SCORE_PASSBACK",
        detail: {
          score,
          maxScore,
          percentage: maxScore > 0 ? Math.round((score / maxScore) * 100) : 0,
          lineitemUrl: link.lineitemUrl,
        },
      },
    });

    return { success: true, platformName: link.platform.name };
  } catch (error) {
    // Log failure
    await prisma.ltiLaunchLog.create({
      data: {
        platformId: link.platform.id,
        userId,
        ltiUserId: link.ltiUserId,
        action: "SCORE_PASSBACK",
        detail: {
          error: error instanceof Error ? error.message : "Unknown error",
          score,
          maxScore,
        },
      },
    });

    return {
      success: false,
      platformName: link.platform.name,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
