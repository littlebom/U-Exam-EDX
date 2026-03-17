"use client";

import { useState, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import {
  UserPlus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Mail,
  Loader2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { toast } from "sonner";
import { useList, useSimpleList } from "@/hooks/use-api";

// ─── Types ───────────────────────────────────────────────────────────

type RoleName =
  | "PLATFORM_ADMIN"
  | "TENANT_OWNER"
  | "ADMIN"
  | "EXAM_CREATOR"
  | "GRADER"
  | "PROCTOR"
  | "CENTER_MANAGER"
  | "CENTER_STAFF"
  | "CANDIDATE";

interface UserItem {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  imageUrl: string | null;
  provider: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  role: { id: string; name: RoleName } | null;
}

interface RoleItem {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────

const ROLE_BADGE_CONFIG: Record<RoleName, { label: string; className: string }> = {
  PLATFORM_ADMIN: {
    label: "Platform Admin",
    className: "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary",
  },
  TENANT_OWNER: {
    label: "Tenant Owner",
    className: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  },
  ADMIN: {
    label: "Admin",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  },
  EXAM_CREATOR: {
    label: "Exam Creator",
    className: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400",
  },
  GRADER: {
    label: "Grader",
    className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  },
  PROCTOR: {
    label: "Proctor",
    className: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  },
  CENTER_MANAGER: {
    label: "Center Manager",
    className: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  },
  CENTER_STAFF: {
    label: "Center Staff",
    className: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
  },
  CANDIDATE: {
    label: "Candidate",
    className: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  },
};

function getRoleBadge(roleName: RoleName | undefined) {
  if (!roleName) return <Badge variant="secondary">ไม่ทราบ</Badge>;
  const c = ROLE_BADGE_CONFIG[roleName];
  if (!c) return <Badge variant="secondary">{roleName}</Badge>;
  return (
    <Badge variant="secondary" className={c.className}>
      {c.label}
    </Badge>
  );
}

function getStatusBadge(isActive: boolean) {
  return isActive ? (
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
  );
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  return date.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Main Component ──────────────────────────────────────────────────

export default function UsersPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const tenantId = session?.tenant?.id;

  // ─── Search & Pagination ─────────────────────────────────────────
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 20;

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // ─── Data Fetching ───────────────────────────────────────────────
  const {
    data: usersData,
    isLoading,
    error,
  } = useList<UserItem>("users", "/api/v1/users", { page, perPage, search });

  const { data: roles } = useSimpleList<RoleItem>("roles", "/api/v1/roles");

  const users = usersData?.data ?? [];
  const meta = usersData?.meta;

  // ─── Dialog States ───────────────────────────────────────────────
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ─── Add User Form ───────────────────────────────────────────────
  const [addForm, setAddForm] = useState({
    name: "",
    email: "",
    password: "",
    roleId: "",
    phone: "",
  });

  const resetAddForm = () => {
    setAddForm({ name: "", email: "", password: "", roleId: "", phone: "" });
  };

  const handleAddUser = async () => {
    if (!addForm.name || !addForm.email || !addForm.password || !addForm.roleId) {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/v1/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "สร้างผู้ใช้ไม่สำเร็จ");
      }
      toast.success("เพิ่มผู้ใช้สำเร็จ");
      setAddDialogOpen(false);
      resetAddForm();
      queryClient.invalidateQueries({ queryKey: ["users"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Edit User ───────────────────────────────────────────────────
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    roleId: "",
    isActive: true,
  });

  const handleOpenEdit = (user: UserItem) => {
    setSelectedUser(user);
    setEditForm({
      name: user.name,
      phone: user.phone ?? "",
      roleId: user.role?.id ?? "",
      isActive: user.isActive,
    });
    setEditDialogOpen(true);
  };

  const handleEditUser = async () => {
    if (!selectedUser || !tenantId) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(
        `/api/v1/tenants/${tenantId}/users/${selectedUser.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editForm),
        }
      );
      // Fallback: use server action via FormData if no dedicated API route
      if (res.status === 404) {
        const formData = new FormData();
        formData.append("name", editForm.name);
        formData.append("phone", editForm.phone);
        formData.append("roleId", editForm.roleId);
        formData.append("isActive", String(editForm.isActive));

        const { updateUserAction } = await import("@/actions/user.actions");
        const result = await updateUserAction(selectedUser.id, formData);
        if (!result.success) throw new Error(result.error || "แก้ไขไม่สำเร็จ");
      } else {
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error?.message || "แก้ไขไม่สำเร็จ");
        }
      }
      toast.success("แก้ไขผู้ใช้สำเร็จ");
      setEditDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["users"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Delete User ─────────────────────────────────────────────────
  const handleOpenDelete = (user: UserItem) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setIsSubmitting(true);
    try {
      const { deleteUserAction } = await import("@/actions/user.actions");
      const result = await deleteUserAction(selectedUser.id);
      if (!result.success) throw new Error(result.error || "ลบไม่สำเร็จ");
      toast.success("ลบผู้ใช้สำเร็จ");
      setDeleteDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["users"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Change Email ────────────────────────────────────────────────
  const [newEmail, setNewEmail] = useState("");

  const handleOpenEmailDialog = (user: UserItem) => {
    setSelectedUser(user);
    setNewEmail("");
    setEmailDialogOpen(true);
  };

  const handleChangeEmail = async () => {
    if (!selectedUser || !newEmail.trim() || !tenantId) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(
        `/api/v1/tenants/${tenantId}/users/${selectedUser.id}/email`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ newEmail: newEmail.trim() }),
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error?.message || "เปลี่ยนอีเมลไม่สำเร็จ");
      }
      toast.success("เปลี่ยนอีเมลสำเร็จ", {
        description: `อีเมลของ ${selectedUser.name} ถูกเปลี่ยนเป็น ${newEmail.trim()} แล้ว`,
      });
      setEmailDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["users"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "เปลี่ยนอีเมลไม่สำเร็จ");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Pagination helpers ──────────────────────────────────────────
  const totalPages = meta?.totalPages ?? 1;
  const total = meta?.total ?? 0;

  const handlePrevPage = useCallback(() => {
    setPage((p) => Math.max(1, p - 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setPage((p) => Math.min(totalPages, p + 1));
  }, [totalPages]);

  // ─── Render ──────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">ผู้ใช้งาน</h1>
          <p className="text-sm text-muted-foreground">
            จัดการผู้ใช้งานทั้งหมดในระบบ
          </p>
        </div>
        <Button
          className="gap-1.5"
          onClick={() => {
            resetAddForm();
            setAddDialogOpen(true);
          }}
        >
          <UserPlus className="h-4 w-4" />
          เพิ่มผู้ใช้
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="ค้นหาชื่อ, อีเมล..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">รายชื่อผู้ใช้</CardTitle>
          <CardDescription>
            {isLoading ? "กำลังโหลด..." : `ทั้งหมด ${total} คน`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="flex items-center gap-2 py-8 justify-center text-destructive">
              <AlertCircle className="h-5 w-5" />
              <p>{error instanceof Error ? error.message : "เกิดข้อผิดพลาด"}</p>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : users.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              {search ? "ไม่พบผู้ใช้ที่ตรงกับการค้นหา" : "ยังไม่มีผู้ใช้ในระบบ"}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ชื่อ</TableHead>
                    <TableHead>อีเมล</TableHead>
                    <TableHead>บทบาท</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead>เข้าสู่ระบบล่าสุด</TableHead>
                    <TableHead className="w-[50px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="font-medium">{user.name}</div>
                        {user.phone && (
                          <div className="text-xs text-muted-foreground">
                            {user.phone}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{user.email}</TableCell>
                      <TableCell>
                        {getRoleBadge(user.role?.name as RoleName | undefined)}
                      </TableCell>
                      <TableCell>{getStatusBadge(user.isActive)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(user.lastLoginAt)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleOpenEdit(user)}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              แก้ไข
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleOpenEmailDialog(user)}
                            >
                              <Mail className="mr-2 h-4 w-4" />
                              เปลี่ยนอีเมล
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleOpenDelete(user)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              ลบ
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">
                    หน้า {page} จาก {totalPages} (ทั้งหมด {total} คน)
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrevPage}
                      disabled={page <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      ก่อนหน้า
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextPage}
                      disabled={page >= totalPages}
                    >
                      ถัดไป
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* ─── Add User Dialog ─────────────────────────────────────────── */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>เพิ่มผู้ใช้ใหม่</DialogTitle>
            <DialogDescription>
              กรอกข้อมูลเพื่อสร้างบัญชีผู้ใช้ใหม่
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="add-name">ชื่อ-นามสกุล *</Label>
              <Input
                id="add-name"
                value={addForm.name}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="สมชาย ใจดี"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-email">อีเมล *</Label>
              <Input
                id="add-email"
                type="email"
                value={addForm.email}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, email: e.target.value }))
                }
                placeholder="email@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-password">รหัสผ่าน *</Label>
              <Input
                id="add-password"
                type="password"
                value={addForm.password}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, password: e.target.value }))
                }
                placeholder="อย่างน้อย 8 ตัวอักษร"
              />
            </div>

            <div className="space-y-2">
              <Label>บทบาท *</Label>
              <Select
                value={addForm.roleId}
                onValueChange={(v) => setAddForm((f) => ({ ...f, roleId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกบทบาท" />
                </SelectTrigger>
                <SelectContent>
                  {(roles ?? []).map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {ROLE_BADGE_CONFIG[role.name as RoleName]?.label ?? role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-phone">โทรศัพท์</Label>
              <Input
                id="add-phone"
                value={addForm.phone}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, phone: e.target.value }))
                }
                placeholder="0812345678"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddDialogOpen(false)}
              disabled={isSubmitting}
            >
              ยกเลิก
            </Button>
            <Button onClick={handleAddUser} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              เพิ่มผู้ใช้
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Edit User Dialog ────────────────────────────────────────── */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>แก้ไขผู้ใช้</DialogTitle>
            <DialogDescription>
              แก้ไขข้อมูลของ{" "}
              <span className="font-medium text-foreground">
                {selectedUser?.name}
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-name">ชื่อ-นามสกุล</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-phone">โทรศัพท์</Label>
              <Input
                id="edit-phone"
                value={editForm.phone}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, phone: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>บทบาท</Label>
              <Select
                value={editForm.roleId}
                onValueChange={(v) => setEditForm((f) => ({ ...f, roleId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกบทบาท" />
                </SelectTrigger>
                <SelectContent>
                  {(roles ?? []).map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {ROLE_BADGE_CONFIG[role.name as RoleName]?.label ?? role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="edit-active">สถานะ Active</Label>
              <Switch
                id="edit-active"
                checked={editForm.isActive}
                onCheckedChange={(checked) =>
                  setEditForm((f) => ({ ...f, isActive: checked }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={isSubmitting}
            >
              ยกเลิก
            </Button>
            <Button onClick={handleEditUser} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              บันทึก
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Admin Email Change Dialog ───────────────────────────────── */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>เปลี่ยนอีเมลผู้ใช้</DialogTitle>
            <DialogDescription>
              เปลี่ยนอีเมลของ{" "}
              <span className="font-medium text-foreground">
                {selectedUser?.name}
              </span>{" "}
              โดยตรง (ไม่ต้องยืนยันทางอีเมล)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-muted-foreground">อีเมลปัจจุบัน</Label>
              <Input
                value={selectedUser?.email ?? ""}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-new-email">อีเมลใหม่</Label>
              <Input
                id="admin-new-email"
                type="email"
                placeholder="newemail@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEmailDialogOpen(false)}
              disabled={isSubmitting}
            >
              ยกเลิก
            </Button>
            <Button
              onClick={handleChangeEmail}
              disabled={!newEmail.trim() || isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              เปลี่ยนอีเมล
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirm Dialog ───────────────────────────────────── */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบผู้ใช้</AlertDialogTitle>
            <AlertDialogDescription>
              คุณต้องการลบ{" "}
              <span className="font-medium text-foreground">
                {selectedUser?.name}
              </span>{" "}
              ({selectedUser?.email}) ออกจากองค์กรหรือไม่?
              การดำเนินการนี้จะทำให้ผู้ใช้ไม่สามารถเข้าถึงองค์กรนี้ได้อีก
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              ลบผู้ใช้
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
