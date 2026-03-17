"use client";

import {
  Wallet,
  Plus,
  CheckCircle2,
  ArrowDownCircle,
  ArrowUpCircle,
  RotateCcw,
  Link2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

// --- Mock Wallet Data ---

type TransactionType = "TOPUP" | "PAYMENT" | "REFUND";

type WalletTransaction = {
  id: string;
  date: string;
  description: string;
  type: TransactionType;
  amount: number;
  balance: number;
};

const walletBalance = 5250.0;

const transactions: WalletTransaction[] = [
  {
    id: "txn_001",
    date: "2026-03-10T10:30:00.000Z",
    description: "เติมเงินผ่าน PromptPay",
    type: "TOPUP",
    amount: 2000,
    balance: 5250,
  },
  {
    id: "txn_002",
    date: "2026-03-08T14:15:00.000Z",
    description: "ชำระค่าสมัครสอบ Cybersecurity Essentials",
    type: "PAYMENT",
    amount: -1500,
    balance: 3250,
  },
  {
    id: "txn_003",
    date: "2026-03-05T09:00:00.000Z",
    description: "คืนเงินค่าสมัครสอบ Data Science Fundamentals",
    type: "REFUND",
    amount: 1200,
    balance: 4750,
  },
  {
    id: "txn_004",
    date: "2026-02-28T16:45:00.000Z",
    description: "ชำระค่าสมัครสอบ Software Engineering Principles",
    type: "PAYMENT",
    amount: -1800,
    balance: 3550,
  },
  {
    id: "txn_005",
    date: "2026-02-20T11:00:00.000Z",
    description: "เติมเงินผ่าน Credit Card",
    type: "TOPUP",
    amount: 3000,
    balance: 5350,
  },
  {
    id: "txn_006",
    date: "2026-02-15T13:30:00.000Z",
    description: "ชำระค่าสมัครสอบ TechCorp Assessment",
    type: "PAYMENT",
    amount: -900,
    balance: 2350,
  },
  {
    id: "txn_007",
    date: "2026-02-10T08:20:00.000Z",
    description: "เติมเงินผ่าน PromptPay",
    type: "TOPUP",
    amount: 1500,
    balance: 3250,
  },
  {
    id: "txn_008",
    date: "2026-02-01T10:00:00.000Z",
    description: "ชำระค่าสมัครสอบ TechCorp Onboarding",
    type: "PAYMENT",
    amount: -500,
    balance: 1750,
  },
];

function getTypeBadge(type: TransactionType) {
  switch (type) {
    case "TOPUP":
      return (
        <Badge
          variant="secondary"
          className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
        >
          เติมเงิน
        </Badge>
      );
    case "PAYMENT":
      return (
        <Badge
          variant="secondary"
          className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
        >
          ชำระ
        </Badge>
      );
    case "REFUND":
      return (
        <Badge
          variant="secondary"
          className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
        >
          คืนเงิน
        </Badge>
      );
    default:
      return <Badge variant="outline">{type}</Badge>;
  }
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 2,
  }).format(Math.abs(amount));
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function WalletPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Wallet className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">e-Wallet</h1>
          <p className="text-sm text-muted-foreground">
            จัดการยอดเงินและประวัติการทำรายการ
          </p>
        </div>
      </div>

      {/* Balance Card + Connected Status */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Balance Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-sm font-medium">
              ยอดคงเหลือ
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            <div className="text-3xl font-bold">
              {new Intl.NumberFormat("th-TH", {
                style: "currency",
                currency: "THB",
                minimumFractionDigits: 2,
              }).format(walletBalance)}
            </div>
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              เติมเงิน
            </Button>
          </CardContent>
        </Card>

        {/* Connection Status Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-sm font-medium">
              สถานะการเชื่อมต่อ
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <Link2 className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <div className="text-sm font-semibold">เชื่อมต่อกับ U-Exam</div>
                <div className="text-xs text-muted-foreground">
                  ใช้ชำระค่าสมัครสอบได้
                </div>
              </div>
            </div>
            <Badge
              variant="secondary"
              className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
            >
              <CheckCircle2 className="mr-1 h-3 w-3" />
              เชื่อมต่อแล้ว
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">ประวัติการทำรายการ</CardTitle>
          <CardDescription>
            รายการทั้งหมด {transactions.length} รายการ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>วันที่</TableHead>
                <TableHead>รายการ</TableHead>
                <TableHead className="text-center">ประเภท</TableHead>
                <TableHead className="text-right">จำนวน</TableHead>
                <TableHead className="text-right">ยอดคงเหลือ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((txn) => (
                <TableRow key={txn.id}>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(txn.date)}
                  </TableCell>
                  <TableCell className="max-w-[250px] truncate font-medium">
                    {txn.description}
                  </TableCell>
                  <TableCell className="text-center">
                    {getTypeBadge(txn.type)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-medium",
                      txn.amount > 0
                        ? "text-green-600"
                        : "text-red-600"
                    )}
                  >
                    {txn.amount > 0 ? "+" : "-"}
                    {formatCurrency(txn.amount)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(txn.balance)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
