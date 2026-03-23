import { prisma } from "@/lib/prisma";
import { errors } from "@/lib/errors";
import { buildPaginationMeta } from "@/types";
import type { invoiceFilterSchema } from "@/lib/validations/payment";
import type { z } from "zod";

type InvoiceFilter = z.infer<typeof invoiceFilterSchema>;

// ─── List Invoices ──────────────────────────────────────────────────

export async function listInvoices(tenantId: string, filters: InvoiceFilter) {
  const { search, page, perPage } = filters;

  const where: Record<string, unknown> = { tenantId };

  if (search) {
    where.OR = [
      { invoiceNumber: { contains: search, mode: "insensitive" } },
      {
        payment: {
          candidate: { name: { contains: search, mode: "insensitive" } },
        },
      },
    ];
  }

  const [total, invoices] = await Promise.all([
    prisma.invoice.count({ where }),
    prisma.invoice.findMany({
      where,
      include: {
        payment: {
          select: {
            id: true,
            amount: true,
            method: true,
            status: true,
            candidate: { select: { id: true, name: true, email: true } },
            registration: {
              select: {
                examSchedule: {
                  select: {
                    exam: { select: { id: true, title: true } },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { issuedAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
  ]);

  return {
    data: invoices,
    meta: buildPaginationMeta(page, perPage, total),
  };
}

// ─── Get Invoice by ID ──────────────────────────────────────────────

export async function getInvoice(tenantId: string, id: string) {
  const invoice = await prisma.invoice.findFirst({
    where: { id, tenantId },
    include: {
      payment: {
        select: {
          id: true,
          amount: true,
          method: true,
          status: true,
          paidAt: true,
          candidate: { select: { id: true, name: true, email: true } },
          registration: {
            select: {
              examSchedule: {
                select: {
                  startDate: true,
                  exam: { select: { id: true, title: true } },
                },
              },
              testCenter: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
  });

  if (!invoice) throw errors.notFound("ไม่พบใบเสร็จ");
  return invoice;
}
