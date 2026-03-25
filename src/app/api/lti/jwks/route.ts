import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/errors";

// Public endpoint — no auth required
export async function GET() {
  try {
    const platforms = await prisma.ltiPlatform.findMany({
      where: { isActive: true },
      select: { publicKey: true, kid: true },
    });

    const keys = platforms.map((p) => {
      const jwk = JSON.parse(p.publicKey);
      return {
        ...jwk,
        kid: p.kid,
        alg: "RS256",
        use: "sig",
      };
    });

    return NextResponse.json({ keys });
  } catch (error) {
    return handleApiError(error);
  }
}
