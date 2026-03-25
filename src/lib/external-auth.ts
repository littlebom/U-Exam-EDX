import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyHmacSignature } from "@/services/ewallet.service";

/**
 * Verify external API request from e-Wallet.
 * Checks X-API-Key, X-Timestamp, X-Signature headers.
 * Returns tenantId if valid, or error response.
 */
export async function verifyExternalRequest(req: NextRequest): Promise<
  | { success: true; tenantId: string }
  | { success: false; response: NextResponse }
> {
  const apiKey = req.headers.get("x-api-key");
  const timestamp = req.headers.get("x-timestamp");
  const signature = req.headers.get("x-signature");

  if (!apiKey || !timestamp || !signature) {
    return {
      success: false,
      response: NextResponse.json(
        { success: false, error: { message: "Missing authentication headers" } },
        { status: 401 }
      ),
    };
  }

  // Validate timestamp within 5-minute window (prevent replay attacks)
  const requestTime = parseInt(timestamp, 10);
  const now = Math.floor(Date.now() / 1000);
  if (isNaN(requestTime) || Math.abs(now - requestTime) > 300) {
    return {
      success: false,
      response: NextResponse.json(
        { success: false, error: { message: "Timestamp expired or invalid" } },
        { status: 401 }
      ),
    };
  }

  // Find connection by API key
  const connection = await prisma.ewalletConnection.findFirst({
    where: { apiKey, isActive: true },
  });

  if (!connection) {
    return {
      success: false,
      response: NextResponse.json(
        { success: false, error: { message: "Invalid API key" } },
        { status: 401 }
      ),
    };
  }

  // For GET requests, verify with empty body
  const body = req.method === "GET" ? "" : await req.text();
  const isValid = verifyHmacSignature(connection.webhookSecret, timestamp, body, signature);

  if (!isValid) {
    return {
      success: false,
      response: NextResponse.json(
        { success: false, error: { message: "Invalid signature or expired timestamp" } },
        { status: 401 }
      ),
    };
  }

  return { success: true, tenantId: connection.tenantId };
}
