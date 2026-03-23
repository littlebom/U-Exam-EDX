"use client";

import { useEffect, useState } from "react";
import {
  Loader2,
  User,
  CreditCard,
  FileText,
  Calendar,
  Hash,
  RotateCcw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PaymentDetail {
  id: string;
  amount: number;
  currency: string;
  method: string;
  status: string;
  transactionId: string | null;
  gatewayRef: string | null;
  description: string | null;
  paidAt: string | null;
  failedAt: string | null;
  createdAt: string;
  candidate: { id: string; name: string; email: string };
  registration: {
    id: string;
    amount: number;
    examSchedule: {
      id: string;
      startDate: string;
      exam: { id: string; title: string };
      testCenter?: { id: string; name: string } | null;
    };
  };
  invoice: {
    id: string;
    invoiceNumber: string;
    subtotal: number;
    taxRate: number;
    taxAmount: number;
    total: number;
    issuedAt: string;
  } | null;
  refunds: Array<{
    id: string;
    amount: number;
    reason: string;
    status: string;
    createdAt: string;
    processedAt: string | null;
  }>;
}

interface PaymentDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentId: string | null;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getMethodLabel(method: string) {
  const labels: Record<string, string> = {
    PROMPTPAY: "PromptPay",
    CREDIT_CARD: "Credit Card",
    BANK_TRANSFER: "โอนเงิน",
    E_WALLET: "e-Wallet",
  };
  return labels[method] || method;
}

function getStatusBadge(status: string) {
  const config: Record<string, { label: string; className: string }> = {
    COMPLETED: {
      label: "ชำระแล้ว",
      className:
        "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    },
    PENDING: {
      label: "รอชำระ",
      className:
        "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    },
    REFUNDED: {
      label: "คืนเงิน",
      className:
        "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    },
    FAILED: {
      label: "ล้มเหลว",
      className:
        "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
    },
  };
  const c = config[status] || { label: status, className: "" };
  return (
    <Badge variant="secondary" className={c.className}>
      {c.label}
    </Badge>
  );
}

function getRefundStatusBadge(status: string) {
  const config: Record<string, { label: string; className: string }> = {
    PENDING: {
      label: "รอพิจารณา",
      className:
        "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    },
    APPROVED: {
      label: "อนุมัติ",
      className:
        "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    },
    PROCESSED: {
      label: "ดำเนินการแล้ว",
      className:
        "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    },
    REJECTED: {
      label: "ปฏิเสธ",
      className:
        "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    },
  };
  const c = config[status] || { label: status, className: "" };
  return (
    <Badge variant="secondary" className={c.className}>
      {c.label}
    </Badge>
  );
}

function InfoRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="text-sm font-medium">{children}</div>
      </div>
    </div>
  );
}

export function PaymentDetailDialog({
  open,
  onOpenChange,
  paymentId,
}: PaymentDetailDialogProps) {
  const [payment, setPayment] = useState<PaymentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open && paymentId) {
      setIsLoading(true);
      fetch(`/api/v1/payments/${paymentId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setPayment(data.data);
        })
        .catch(() => {})
        .finally(() => setIsLoading(false));
    } else {
      setPayment(null);
    }
  }, [open, paymentId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>รายละเอียดการชำระเงิน</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : payment ? (
          <div className="space-y-5">
            {/* Status + Amount */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">
                  {formatCurrency(payment.amount)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {payment.currency}
                </p>
              </div>
              {getStatusBadge(payment.status)}
            </div>

            <Separator />

            {/* Candidate */}
            <InfoRow icon={User} label="ผู้ชำระเงิน">
              <p>{payment.candidate.name}</p>
              <p className="text-xs font-normal text-muted-foreground">
                {payment.candidate.email}
              </p>
            </InfoRow>

            {/* Exam */}
            <InfoRow icon={FileText} label="ข้อสอบ">
              {payment.registration.examSchedule.exam.title}
            </InfoRow>

            {/* Method */}
            <InfoRow icon={CreditCard} label="วิธีชำระเงิน">
              {getMethodLabel(payment.method)}
            </InfoRow>

            {/* Transaction ID */}
            {payment.transactionId && (
              <InfoRow icon={Hash} label="เลขที่ธุรกรรม">
                <span className="font-mono text-xs">
                  {payment.transactionId}
                </span>
              </InfoRow>
            )}

            {/* Gateway Ref */}
            {payment.gatewayRef && (
              <InfoRow icon={Hash} label="อ้างอิง Gateway">
                <span className="font-mono text-xs">
                  {payment.gatewayRef}
                </span>
              </InfoRow>
            )}

            {/* Dates */}
            <InfoRow icon={Calendar} label="วันที่สร้าง">
              {formatDateTime(payment.createdAt)}
            </InfoRow>
            {payment.paidAt && (
              <InfoRow icon={Calendar} label="วันที่ชำระ">
                {formatDateTime(payment.paidAt)}
              </InfoRow>
            )}

            {/* Invoice */}
            {payment.invoice && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-semibold mb-3">ใบเสร็จ</h4>
                  <div className="rounded-lg border p-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        เลขที่ใบเสร็จ
                      </span>
                      <span className="font-mono font-medium">
                        {payment.invoice.invoiceNumber}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ยอดรวม</span>
                      <span>
                        {formatCurrency(payment.invoice.subtotal)}
                      </span>
                    </div>
                    {payment.invoice.taxAmount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          ภาษี ({payment.invoice.taxRate}%)
                        </span>
                        <span>
                          {formatCurrency(payment.invoice.taxAmount)}
                        </span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>รวมทั้งสิ้น</span>
                      <span>{formatCurrency(payment.invoice.total)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>วันที่ออก</span>
                      <span>
                        {formatDateTime(payment.invoice.issuedAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Refunds */}
            {payment.refunds && payment.refunds.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <RotateCcw className="h-4 w-4" />
                    ประวัติคืนเงิน ({payment.refunds.length})
                  </h4>
                  <div className="space-y-2">
                    {payment.refunds.map((refund) => (
                      <div
                        key={refund.id}
                        className="rounded-lg border p-3 text-sm space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-red-600">
                            {formatCurrency(refund.amount)}
                          </span>
                          {getRefundStatusBadge(refund.status)}
                        </div>
                        <p className="text-muted-foreground text-xs">
                          {refund.reason}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {formatDateTime(refund.createdAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Actions */}
            <Separator />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                ปิด
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <p>ไม่พบข้อมูลการชำระเงิน</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
