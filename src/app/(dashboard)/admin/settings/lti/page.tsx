"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Link2,
  Plus,
  Pencil,
  Trash2,
  Copy,
  Loader2,
  Users,
  ArrowRightLeft,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { toast } from "sonner";
import { useList } from "@/hooks/use-api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type LtiPlatform = {
  id: string;
  name: string;
  issuer: string;
  clientId: string;
  deploymentId: string;
  authLoginUrl: string;
  authTokenUrl: string;
  jwksUrl: string;
  isActive: boolean;
  createdAt: string;
  _count?: { userLinks: number; launchLogs: number };
};

type LtiUserLink = {
  id: string;
  ltiUserId: string;
  ltiEmail: string | null;
  ltiName: string | null;
  user: { id: string; name: string | null; email: string };
  platform: { id: string; name: string };
  courseId: string | null;
  createdAt: string;
};

type LtiLaunchLog = {
  id: string;
  action: string;
  userEmail: string | null;
  userName: string | null;
  platformName: string | null;
  detail: string | null;
  createdAt: string;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const EMPTY_FORM: Omit<LtiPlatform, "id" | "isActive" | "createdAt" | "_count"> = {
  name: "",
  issuer: "",
  clientId: "",
  deploymentId: "",
  authLoginUrl: "",
  authTokenUrl: "",
  jwksUrl: "",
};

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
  toast.success("คัดลอกแล้ว");
}

function actionBadge(action: string) {
  const map: Record<string, string> = {
    LINK: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    RELINK: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    SCORE_PASSBACK: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    LAUNCH_FAIL: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  };
  return (
    <Badge variant="secondary" className={map[action] ?? ""}>
      {action}
    </Badge>
  );
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function LtiSettingsPage() {
  const queryClient = useQueryClient();

  // --- Platforms ---
  const { data: platformsResult, isLoading: platformsLoading } = useList<LtiPlatform>(
    "lti-platforms",
    "/api/v1/lti/platforms",
    { perPage: 50 }
  );

  // --- User Links ---
  const [linksPage, setLinksPage] = useState(1);
  const { data: linksResult, isLoading: linksLoading } = useList<LtiUserLink>(
    "lti-user-links",
    "/api/v1/lti/user-links",
    { page: linksPage, perPage: 20 }
  );

  // --- Launch Logs ---
  const [logsPage, setLogsPage] = useState(1);
  const { data: logsResult, isLoading: logsLoading } = useList<LtiLaunchLog>(
    "lti-launch-logs",
    "/api/v1/lti/launch-logs",
    { page: logsPage, perPage: 20 }
  );

  // --- Dialog state ---
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // --- Mutations ---
  const saveMutation = useMutation({
    mutationFn: async () => {
      const isEdit = !!editingId;
      const url = isEdit
        ? `/api/v1/lti/platforms/${editingId}`
        : "/api/v1/lti/platforms";
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message ?? "เกิดข้อผิดพลาด");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success(editingId ? "อัปเดต Platform สำเร็จ" : "เพิ่ม Platform สำเร็จ");
      closeDialog();
      queryClient.invalidateQueries({ queryKey: ["lti-platforms"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/v1/lti/platforms/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message ?? "เกิดข้อผิดพลาด");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("ลบ Platform สำเร็จ");
      setDeleteId(null);
      queryClient.invalidateQueries({ queryKey: ["lti-platforms"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // --- Helpers ---
  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowDialog(true);
  }

  function openEdit(p: LtiPlatform) {
    setEditingId(p.id);
    setForm({
      name: p.name,
      issuer: p.issuer,
      clientId: p.clientId,
      deploymentId: p.deploymentId,
      authLoginUrl: p.authLoginUrl,
      authTokenUrl: p.authTokenUrl,
      jwksUrl: p.jwksUrl,
    });
    setShowDialog(true);
  }

  function closeDialog() {
    setShowDialog(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  function updateField(field: keyof typeof EMPTY_FORM, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const platforms: LtiPlatform[] = platformsResult?.data ?? [];
  const userLinks: LtiUserLink[] = linksResult?.data ?? [];
  const linksMeta = linksResult?.meta;
  const launchLogs: LtiLaunchLog[] = logsResult?.data ?? [];
  const logsMeta = logsResult?.meta;

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">LTI Integration</h1>
        <p className="text-sm text-muted-foreground">
          จัดการการเชื่อมต่อ LTI 1.3 กับ LMS ภายนอก เช่น Open edX, Moodle, Canvas
        </p>
      </div>

      <Tabs defaultValue="platforms" className="space-y-4">
        <TabsList>
          <TabsTrigger value="platforms" className="gap-1.5">
            <Link2 className="h-4 w-4" />
            แพลตฟอร์ม
          </TabsTrigger>
          <TabsTrigger value="linked-users" className="gap-1.5">
            <Users className="h-4 w-4" />
            ผู้ใช้ที่เชื่อมต่อ
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-1.5">
            <Clock className="h-4 w-4" />
            บันทึก
          </TabsTrigger>
        </TabsList>

        {/* ============================================================== */}
        {/* Tab 1: Platforms                                                */}
        {/* ============================================================== */}
        <TabsContent value="platforms" className="space-y-4">
          <div className="flex justify-end">
            <Button className="gap-1.5" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              เพิ่ม Platform
            </Button>
          </div>

          {platformsLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : platforms.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Link2 className="mb-3 h-12 w-12 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  ยังไม่มี LTI Platform ที่เชื่อมต่อ
                </p>
                <Button variant="outline" className="mt-4 gap-1.5" onClick={openCreate}>
                  <Plus className="h-4 w-4" />
                  เพิ่ม Platform แรก
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {platforms.map((p) => (
                <Card key={p.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-base">{p.name}</CardTitle>
                        <CardDescription className="font-mono text-xs">
                          {p.issuer}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {p.isActive ? (
                          <Badge
                            variant="secondary"
                            className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          >
                            Active
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
                          >
                            Inactive
                          </Badge>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(p.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Stats */}
                    <div className="flex gap-6 text-sm text-muted-foreground">
                      <span className="font-mono">Client ID: {p.clientId}</span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {p._count?.userLinks ?? 0} ผู้ใช้เชื่อมต่อ
                      </span>
                      <span className="flex items-center gap-1">
                        <ArrowRightLeft className="h-3.5 w-3.5" />
                        {p._count?.launchLogs ?? 0} passback
                      </span>
                    </div>

                    {/* U-Exam URLs */}
                    <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        U-Exam URLs (ใส่ใน LMS)
                      </p>
                      <UrlRow label="Tool Launch URL" url={`${origin}/api/lti/launch`} />
                      <UrlRow label="Tool Login URL" url={`${origin}/api/lti/login`} />
                      <UrlRow label="Tool JWKS URL" url={`${origin}/api/lti/jwks`} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ============================================================== */}
        {/* Tab 2: Linked Users                                            */}
        {/* ============================================================== */}
        <TabsContent value="linked-users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">ผู้ใช้ที่เชื่อมต่อ LTI</CardTitle>
              <CardDescription>
                รายการผู้ใช้ที่เชื่อมต่อบัญชี LMS กับ U-Exam แล้ว
              </CardDescription>
            </CardHeader>
            <CardContent>
              {linksLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : userLinks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="mb-3 h-12 w-12 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">
                    ยังไม่มีผู้ใช้ที่เชื่อมต่อ
                  </p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ผู้ใช้ edX</TableHead>
                        <TableHead>ผู้ใช้ U-Exam</TableHead>
                        <TableHead>Platform</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>วันที่เชื่อมต่อ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userLinks.map((link) => (
                        <TableRow key={link.id}>
                          <TableCell>
                            <div>
                              <p className="text-sm font-medium">{link.ltiName ?? "-"}</p>
                              <p className="text-xs text-muted-foreground">
                                {link.ltiEmail ?? link.ltiUserId}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm font-medium">
                                {link.user?.name ?? "-"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {link.user?.email}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{link.platform?.name}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {link.courseId ?? "-"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(link.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  {linksMeta && linksMeta.totalPages > 1 && (
                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        ทั้งหมด {linksMeta.total} รายการ
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={linksPage <= 1}
                          onClick={() => setLinksPage((p) => p - 1)}
                        >
                          ก่อนหน้า
                        </Button>
                        <span className="flex items-center text-sm text-muted-foreground">
                          หน้า {linksPage} / {linksMeta.totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={linksPage >= linksMeta.totalPages}
                          onClick={() => setLinksPage((p) => p + 1)}
                        >
                          ถัดไป
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================================== */}
        {/* Tab 3: Launch Logs                                             */}
        {/* ============================================================== */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">บันทึกการใช้งาน LTI</CardTitle>
              <CardDescription>
                Launch, Link, Score Passback และข้อผิดพลาดต่าง ๆ
              </CardDescription>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : launchLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Clock className="mb-3 h-12 w-12 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">
                    ยังไม่มีบันทึก
                  </p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>เวลา</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>ผู้ใช้</TableHead>
                        <TableHead>Platform</TableHead>
                        <TableHead>รายละเอียด</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {launchLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                            {formatDate(log.createdAt)}
                          </TableCell>
                          <TableCell>{actionBadge(log.action)}</TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm">{log.userName ?? "-"}</p>
                              <p className="text-xs text-muted-foreground">
                                {log.userEmail ?? ""}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {log.platformName ?? "-"}
                          </TableCell>
                          <TableCell className="max-w-[300px] truncate text-sm text-muted-foreground">
                            {log.detail ?? "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  {logsMeta && logsMeta.totalPages > 1 && (
                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        ทั้งหมด {logsMeta.total} รายการ
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={logsPage <= 1}
                          onClick={() => setLogsPage((p) => p - 1)}
                        >
                          ก่อนหน้า
                        </Button>
                        <span className="flex items-center text-sm text-muted-foreground">
                          หน้า {logsPage} / {logsMeta.totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={logsPage >= logsMeta.totalPages}
                          onClick={() => setLogsPage((p) => p + 1)}
                        >
                          ถัดไป
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ================================================================ */}
      {/* Platform Create / Edit Dialog                                    */}
      {/* ================================================================ */}
      <Dialog open={showDialog} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "แก้ไข LTI Platform" : "เพิ่ม LTI Platform"}
            </DialogTitle>
            <DialogDescription>
              กรอกข้อมูล LTI 1.3 ที่ได้จาก LMS (เช่น Open edX, Moodle, Canvas)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="lti-name">ชื่อ Platform</Label>
              <Input
                id="lti-name"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="Open edX Production"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lti-issuer">Issuer URL</Label>
              <Input
                id="lti-issuer"
                value={form.issuer}
                onChange={(e) => updateField("issuer", e.target.value)}
                placeholder="https://lms.example.com"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="lti-clientId">Client ID</Label>
                <Input
                  id="lti-clientId"
                  value={form.clientId}
                  onChange={(e) => updateField("clientId", e.target.value)}
                  placeholder="client-id-from-lms"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lti-deploymentId">Deployment ID</Label>
                <Input
                  id="lti-deploymentId"
                  value={form.deploymentId}
                  onChange={(e) => updateField("deploymentId", e.target.value)}
                  placeholder="1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lti-authLoginUrl">Auth Login URL</Label>
              <Input
                id="lti-authLoginUrl"
                value={form.authLoginUrl}
                onChange={(e) => updateField("authLoginUrl", e.target.value)}
                placeholder="https://lms.example.com/lti/authorize"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lti-authTokenUrl">Auth Token URL</Label>
              <Input
                id="lti-authTokenUrl"
                value={form.authTokenUrl}
                onChange={(e) => updateField("authTokenUrl", e.target.value)}
                placeholder="https://lms.example.com/oauth2/access_token"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lti-jwksUrl">JWKS URL</Label>
              <Input
                id="lti-jwksUrl"
                value={form.jwksUrl}
                onChange={(e) => updateField("jwksUrl", e.target.value)}
                placeholder="https://lms.example.com/oauth2/jwks"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              ยกเลิก
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={
                !form.name.trim() ||
                !form.issuer.trim() ||
                !form.clientId.trim() ||
                saveMutation.isPending
              }
            >
              {saveMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : editingId ? (
                <Pencil className="mr-2 h-4 w-4" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              {editingId ? "บันทึก" : "เพิ่ม"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================================================================ */}
      {/* Delete Confirmation                                              */}
      {/* ================================================================ */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบ Platform</AlertDialogTitle>
            <AlertDialogDescription>
              การลบ Platform จะลบข้อมูลการเชื่อมต่อ LTI ทั้งหมดที่เกี่ยวข้อง
              ผู้ใช้ที่เชื่อมต่อไว้จะไม่สามารถ launch ผ่าน LMS ได้อีก
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              ลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function UrlRow({ label, url }: { label: string; url: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <code className="block truncate text-xs">{url}</code>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0"
        onClick={() => copyToClipboard(url)}
      >
        <Copy className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
