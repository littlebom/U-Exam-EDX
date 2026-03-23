"use client";

import { useState } from "react";
import {
  ScrollText,
  Loader2,
  Search,
  Shield,
  LogIn,
  FileText,
  Users,
  Settings,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useList } from "@/hooks/use-api";

// ─── Types ──────────────────────────────────────────────────────────

interface AuditLogItem {
  id: string;
  action: string;
  category: string;
  target: string | null;
  detail: Record<string, unknown> | null;
  ipAddress: string | null;
  userName: string | null;
  userEmail: string | null;
  createdAt: string;
}

// ─── Constants ──────────────────────────────────────────────────────

const CATEGORIES = [
  { value: "all", label: "ทุกประเภท", icon: Filter },
  { value: "AUTH", label: "เข้าสู่ระบบ", icon: LogIn },
  { value: "EXAM", label: "การสอบ", icon: FileText },
  { value: "ADMIN", label: "จัดการ", icon: Shield },
  { value: "USER", label: "ผู้ใช้", icon: Users },
  { value: "SYSTEM", label: "ระบบ", icon: Settings },
];

const ACTION_LABELS: Record<string, string> = {
  AUTH_LOGIN: "เข้าสู่ระบบ",
  AUTH_LOGIN_FAILED: "เข้าสู่ระบบไม่สำเร็จ",
  AUTH_LOGOUT: "ออกจากระบบ",
  AUTH_PASSWORD_CHANGE: "เปลี่ยนรหัสผ่าน",
  EXAM_START: "เริ่มทำข้อสอบ",
  EXAM_SUBMIT: "ส่งข้อสอบ",
  EXAM_TIMEOUT: "หมดเวลา",
  EXAM_FORCE_SUBMIT: "บังคับส่ง",
  EXAM_CREATE: "สร้างชุดสอบ",
  EXAM_UPDATE: "แก้ไขชุดสอบ",
  EXAM_DELETE: "ลบชุดสอบ",
  SCHEDULE_CREATE: "สร้างรอบสอบ",
  SCHEDULE_UPDATE: "แก้ไขรอบสอบ",
  REGISTRATION_APPROVE: "อนุมัติสมัครสอบ",
  REGISTRATION_CANCEL: "ยกเลิกสมัครสอบ",
  CERTIFICATE_ISSUE: "ออกใบรับรอง",
  CERTIFICATE_REVOKE: "เพิกถอนใบรับรอง",
  GRADE_CONFIRM: "ยืนยันผลสอบ",
  USER_CREATE: "สร้างผู้ใช้",
  USER_UPDATE: "แก้ไขผู้ใช้",
  USER_DELETE: "ลบผู้ใช้",
  ROLE_CHANGE: "เปลี่ยนสิทธิ์",
  SETTINGS_UPDATE: "แก้ไขตั้งค่า",
  EMAIL_SENT: "ส่งอีเมล",
  NOTIFICATION_SENT: "ส่งแจ้งเตือน",
};

const CATEGORY_COLORS: Record<string, string> = {
  AUTH: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  EXAM: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  ADMIN: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  USER: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  SYSTEM: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

// ─── Helpers ────────────────────────────────────────────────────────

function formatDetail(detail: Record<string, unknown>): string {
  const parts: string[] = [];
  if (detail.email) parts.push(`email: ${detail.email}`);
  if (detail.provider) parts.push(`via ${detail.provider}`);
  if (detail.reason) parts.push(`reason: ${detail.reason}`);
  if (detail.status) parts.push(`status: ${detail.status}`);
  if (detail.examTitle) parts.push(String(detail.examTitle));
  if (detail.scheduleId) parts.push(`schedule: ${String(detail.scheduleId).substring(0, 8)}...`);
  return parts.length > 0 ? parts.join(", ") : JSON.stringify(detail).substring(0, 50);
}

// ─── Page ───────────────────────────────────────────────────────────

export default function AuditLogsPage() {
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const params: Record<string, string | number> = { page, perPage: 50 };
  if (category !== "all") params.category = category;
  if (search.trim()) params.search = search.trim();

  const { data: result, isLoading } = useList<AuditLogItem>(
    "audit-logs",
    "/api/v1/audit-logs",
    params
  );
  const logs = result?.data ?? [];
  const meta = result?.meta;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <ScrollText className="h-6 w-6" />
          Audit Logs
        </h1>
        <p className="text-sm text-muted-foreground">
          บันทึกกิจกรรมทั้งหมดในระบบ
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select
          value={category}
          onValueChange={(v) => { setCategory(v); setPage(1); }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="ประเภท" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                <div className="flex items-center gap-2">
                  <c.icon className="h-3.5 w-3.5" />
                  {c.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="ค้นหา action, ผู้ใช้..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">บันทึกกิจกรรม</CardTitle>
          <CardDescription>
            {meta ? `ทั้งหมด ${meta.total} รายการ` : "กำลังโหลด..."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <ScrollText className="h-10 w-10 mb-3 opacity-50" />
              <p className="font-medium">ยังไม่มี logs</p>
              <p className="text-sm">กิจกรรมในระบบจะแสดงที่นี่</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[160px]">เวลา</TableHead>
                  <TableHead>ประเภท</TableHead>
                  <TableHead>กิจกรรม</TableHead>
                  <TableHead>ผู้ใช้</TableHead>
                  <TableHead>รายละเอียด</TableHead>
                  <TableHead className="w-[120px]">IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString("th-TH", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`text-xs ${CATEGORY_COLORS[log.category] ?? ""}`}
                      >
                        {log.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {ACTION_LABELS[log.action] ?? log.action}
                    </TableCell>
                    <TableCell>
                      {log.userName ? (
                        <div>
                          <p className="text-sm">{log.userName}</p>
                          <p className="text-xs text-muted-foreground">{log.userEmail}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                      {log.target
                        ? log.target
                        : log.detail
                        ? formatDetail(log.detail)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {log.ipAddress ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                หน้า {meta.page} จาก {meta.totalPages}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  ก่อนหน้า
                </Button>
                <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}>
                  ถัดไป
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
