import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyHmacSignature, processEwalletWebhook } from "@/services/ewallet.service";
import { handleApiError } from "@/lib/errors";
import { z } from "zod";

const webhookSchema = z.object({
  tenantId: z.string().uuid(),
  transactionId: z.string().uuid(),
  externalTransactionId: z.string().min(1),
  status: z.enum(["COMPLETED", "FAILED"]),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const timestamp = req.headers.get("x-timestamp");
    const signature = req.headers.get("x-signature");

    if (!timestamp || !signature) {
      return NextResponse.json(
        { success: false, error: { message: "Missing webhook headers" } },
        { status: 401 }
      );
    }

    const rawBody = await req.text();
    const body = JSON.parse(rawBody);
    const data = webhookSchema.parse(body);

    // Find connection to verify signature
    const connection = await prisma.ewalletConnection.findUnique({
      where: { tenantId: data.tenantId },
    });

    if (!connection || !connection.isActive) {
      return NextResponse.json(
        { success: false, error: { message: "e-Wallet not configured" } },
        { status: 400 }
      );
    }

    const isValid = verifyHmacSignature(
      connection.webhookSecret,
      timestamp,
      rawBody,
      signature
    );

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: { message: "Invalid signature" } },
        { status: 401 }
      );
    }

    const result = await processEwalletWebhook(data.tenantId, data);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error);
  }
}
