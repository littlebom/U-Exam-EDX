import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError, errors } from "@/lib/errors";
import {
  validateLtiLaunch,
  linkOrMatchUser,
  updateLineitem,
} from "@/services/lti.service";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const idToken = formData.get("id_token") as string | null;
    const state = formData.get("state") as string | null;

    if (!idToken) {
      throw errors.badRequest("Missing id_token");
    }

    // Validate the LTI launch JWT and extract claims
    const claims = await validateLtiLaunch(idToken, state ?? undefined);

    const platform = await prisma.ltiPlatform.findFirst({
      where: { issuer: claims.iss, isActive: true },
    });

    if (!platform) {
      throw errors.notFound("LTI platform not found");
    }

    // Link or create a U-Exam user from LTI claims
    const user = await linkOrMatchUser(platform, claims);

    // Store AGS lineitem URL if present
    if (claims.endpoint?.lineitem) {
      await updateLineitem(platform, claims);
    }

    // Log the launch
    await prisma.ltiLaunchLog.create({
      data: {
        platformId: platform.id,
        userId: user.id,
        action: "LAUNCH",
        ltiMessageType: claims["https://purl.imsglobal.org/spec/lti/claim/message_type"] ?? "LtiResourceLinkRequest",
        resourceLinkId: claims["https://purl.imsglobal.org/spec/lti/claim/resource_link"]?.id ?? null,
        contextId: claims["https://purl.imsglobal.org/spec/lti/claim/context"]?.id ?? null,
        ipAddress: req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? null,
      },
    });

    // Redirect to candidate dashboard
    const baseUrl = new URL(req.url).origin;
    return NextResponse.redirect(`${baseUrl}/profile`);
  } catch (error) {
    return handleApiError(error);
  }
}
