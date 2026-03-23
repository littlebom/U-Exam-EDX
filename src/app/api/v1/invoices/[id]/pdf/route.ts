import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { requirePermission } from "@/lib/rbac";
import { handleApiError } from "@/lib/errors";
import { getInvoice } from "@/services/invoice.service";
import {
  InvoiceTemplate,
  type InvoicePdfData,
} from "@/lib/pdf/invoice-template";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("payment:invoice");
    const { id } = await params;

    const invoice = await getInvoice(session.tenantId, id);

    // Build PDF data
    const items =
      Array.isArray(invoice.items) && invoice.items.length > 0
        ? (invoice.items as Array<{ description: string; amount: number }>)
        : [
            {
              description: `Exam Registration - ${invoice.payment?.registration?.examSchedule?.exam?.title ?? "Exam"}`,
              amount: invoice.subtotal,
            },
          ];

    const pdfData: InvoicePdfData = {
      invoiceNumber: invoice.invoiceNumber,
      issuedAt: invoice.issuedAt.toISOString(),
      subtotal: invoice.subtotal,
      taxRate: invoice.taxRate,
      taxAmount: invoice.taxAmount,
      total: invoice.total,
      items,
      candidate: {
        name: invoice.payment?.candidate?.name ?? "Unknown",
        email: invoice.payment?.candidate?.email ?? "",
      },
      payment: {
        method: invoice.payment?.method ?? "",
        transactionId: invoice.payment?.transactionId ?? null,
        paidAt: invoice.payment?.paidAt?.toISOString() ?? null,
      },
      exam: {
        title:
          invoice.payment?.registration?.examSchedule?.exam?.title ??
          "Exam",
        date:
          invoice.payment?.registration?.examSchedule?.startDate?.toISOString() ??
          "",
      },
    };

    // Render PDF to buffer
    const buffer = await renderToBuffer(
      InvoiceTemplate({ data: pdfData })
    );

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${invoice.invoiceNumber}.pdf"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
