import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError, errors } from "@/lib/errors";
import { handleOidcLogin } from "@/services/lti.service";

export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const iss = params.get("iss");
    const loginHint = params.get("login_hint");
    const targetLinkUri = params.get("target_link_uri");
    const ltiMessageHint = params.get("lti_message_hint");
    const clientId = params.get("client_id");

    if (!iss || !loginHint || !targetLinkUri) {
      throw errors.badRequest("Missing required OIDC login parameters");
    }

    const platform = await prisma.ltiPlatform.findFirst({
      where: {
        isActive: true,
        OR: [
          { issuer: iss },
          ...(clientId ? [{ clientId }] : []),
        ],
      },
    });

    if (!platform) {
      throw errors.notFound("LTI platform not found");
    }

    const redirectUrl = await handleOidcLogin(platform, {
      iss,
      loginHint,
      targetLinkUri,
      ltiMessageHint: ltiMessageHint ?? undefined,
      clientId: clientId ?? undefined,
    });

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    return handleApiError(error);
  }
}
