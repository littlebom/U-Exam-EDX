"use client";

import { useState, useMemo, useEffect } from "react";
import { Shield, Save, Loader2, Users, Lock, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";
import { useQuery } from "@tanstack/react-query";
import { useSimpleList } from "@/hooks/use-api";
import { cn } from "@/lib/utils";

// --- Types ---

interface RoleItem {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  rolePermissions: { permissionId: string }[];
  _count: { userTenants: number };
}

interface PermissionItem {
  id: string;
  code: string;
  module: string;
  action: string;
  description: string | null;
}

// Module labels (TH)
const MODULE_LABELS: Record<string, string> = {
  auth: "ยืนยันตัวตน",
  tenant: "องค์กร",
  user: "ผู้ใช้งาน",
  exam: "ชุดสอบ",
  question: "ข้อสอบ",
  session: "เซสชันสอบ",
  grading: "ตรวจข้อสอบ",
  center: "ศูนย์สอบ",
  registration: "การสมัครสอบ",
  payment: "การเงิน",
  certificate: "ใบรับรอง",
  analytics: "รายงาน",
  notification: "แจ้งเตือน",
  proctoring: "คุมสอบ",
  settings: "ตั้งค่า",
};

const ACTION_LABELS: Record<string, string> = {
  list: "ดู",
  create: "สร้าง",
  update: "แก้ไข",
  delete: "ลบ",
  manage: "จัดการ",
  grade: "ตรวจ",
  proctor: "คุม",
  export: "ส่งออก",
};

// Bypass roles — these have all permissions, cannot edit
const BYPASS_ROLES = ["PLATFORM_ADMIN", "TENANT_OWNER"];

export default function UserRolesPage() {
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [editedPermissionIds, setEditedPermissionIds] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Fetch roles from DB
  const { data: roles, isLoading: rolesLoading, refetch: refetchRoles } = useSimpleList<RoleItem>("roles", "/api/v1/roles");

  // Fetch permissions from DB
  const { data: permData, isLoading: permsLoading } = useQuery<{
    permissions: PermissionItem[];
    grouped: Record<string, PermissionItem[]>;
  }>({
    queryKey: ["permissions-all"],
    queryFn: async () => {
      const res = await fetch("/api/v1/permissions");
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const json = await res.json();
      return json.data;
    },
  });

  // Get available actions across all modules
  const allActions = useMemo(() => {
    if (!permData?.permissions) return [];
    const actions = new Set(permData.permissions.map((p) => p.action));
    // Sort with common CRUD first
    const order = ["list", "create", "update", "delete", "manage", "grade", "proctor", "export"];
    return Array.from(actions).sort((a, b) => {
      const ai = order.indexOf(a);
      const bi = order.indexOf(b);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
  }, [permData]);

  // Editable roles (exclude bypass roles)
  const editableRoles = useMemo(
    () => roles?.filter((r) => !BYPASS_ROLES.includes(r.name)) ?? [],
    [roles]
  );

  // Auto-select first editable role on load
  useEffect(() => {
    if (editableRoles.length > 0 && !selectedRoleId) {
      const first = editableRoles[0];
      setSelectedRoleId(first.id);
      setEditedPermissionIds(new Set(first.rolePermissions.map((rp) => rp.permissionId)));
    }
  }, [editableRoles, selectedRoleId]);

  // Selected role info
  const selectedRole = useMemo(
    () => roles?.find((r) => r.id === selectedRoleId),
    [roles, selectedRoleId]
  );

  // Handle role selection change
  const handleRoleChange = (roleId: string) => {
    if (isDirty) {
      const confirmed = window.confirm("มีการเปลี่ยนแปลงที่ยังไม่บันทึก ต้องการเปลี่ยน Role หรือไม่?");
      if (!confirmed) return;
    }
    setSelectedRoleId(roleId);
    const role = roles?.find((r) => r.id === roleId);
    if (role) {
      setEditedPermissionIds(new Set(role.rolePermissions.map((rp) => rp.permissionId)));
    }
    setIsDirty(false);
  };

  // Toggle permission
  const handleTogglePermission = (permissionId: string) => {
    if (selectedRole?.isSystem) return;

    setEditedPermissionIds((prev) => {
      const next = new Set(prev);
      if (next.has(permissionId)) {
        next.delete(permissionId);
      } else {
        next.add(permissionId);
      }
      return next;
    });
    setIsDirty(true);
  };

  // Save permissions
  const handleSave = async () => {
    if (!selectedRoleId) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/v1/roles/${selectedRoleId}/permissions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissionIds: Array.from(editedPermissionIds) }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error?.message || "บันทึกไม่สำเร็จ");
      }

      setSaveMessage({ type: "success", text: "อัปเดตสิทธิ์เรียบร้อยแล้ว" });
      setIsDirty(false);
      refetchRoles();
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      setSaveMessage({
        type: "error",
        text: err instanceof Error ? err.message : "บันทึกไม่สำเร็จ",
      });
      setTimeout(() => setSaveMessage(null), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const isLoading = rolesLoading || permsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">จัดการสิทธิ์ (RBAC)</h1>
          <p className="text-sm text-muted-foreground">
            กำหนดสิทธิ์การเข้าถึงทรัพยากรสำหรับแต่ละบทบาท
          </p>
        </div>
        {isDirty && !selectedRole?.isSystem && (
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            บันทึก
          </Button>
        )}
      </div>

      {/* Save Message */}
      {saveMessage && (
        <Alert variant={saveMessage.type === "error" ? "destructive" : "default"}>
          <AlertDescription>{saveMessage.text}</AlertDescription>
        </Alert>
      )}

      {/* Role Selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <Shield className="h-5 w-5 text-muted-foreground" />
        <Select value={selectedRoleId} onValueChange={handleRoleChange}>
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="เลือกบทบาท" />
          </SelectTrigger>
          <SelectContent>
            {editableRoles.map((role) => (
              <SelectItem key={role.id} value={role.id}>
                <div className="flex items-center gap-2">
                  <span>{role.name}</span>
                  {role.isSystem && <Lock className="h-3 w-3 text-muted-foreground" />}
                  <span className="text-xs text-muted-foreground">
                    ({role._count.userTenants} คน)
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedRole && (
          <div className="flex items-center gap-2">
            <Badge variant={selectedRole.isSystem ? "secondary" : "outline"}>
              {selectedRole.isSystem ? "System Role" : "Custom Role"}
            </Badge>
            <Badge variant="outline">
              <Users className="mr-1 h-3 w-3" />
              {selectedRole._count.userTenants} คน
            </Badge>
            <Badge variant="outline">
              {editedPermissionIds.size} สิทธิ์
            </Badge>
          </div>
        )}
      </div>

      {/* System Role Warning */}
      {selectedRole?.isSystem && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>{selectedRole.name}</strong> เป็น Role ระบบ — ไม่สามารถแก้ไขสิทธิ์ได้
          </AlertDescription>
        </Alert>
      )}

      {/* Permission Matrix */}
      {permData?.grouped && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">ตารางสิทธิ์</CardTitle>
            <CardDescription>
              เลือกสิทธิ์สำหรับบทบาท{" "}
              <Badge variant="outline">{selectedRole?.name}</Badge>
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[160px] sticky left-0 bg-background">Module</TableHead>
                  {allActions.map((action) => (
                    <TableHead key={action} className="text-center w-[80px]">
                      {ACTION_LABELS[action] || action}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(permData.grouped).map(([module, perms]) => (
                  <TableRow key={module}>
                    <TableCell className="font-medium sticky left-0 bg-background">
                      {MODULE_LABELS[module] || module}
                    </TableCell>
                    {allActions.map((action) => {
                      const perm = perms.find((p) => p.action === action);
                      if (!perm) {
                        return (
                          <TableCell key={action} className="text-center text-muted-foreground">
                            —
                          </TableCell>
                        );
                      }
                      const isChecked = editedPermissionIds.has(perm.id);
                      const isDisabled = !!selectedRole?.isSystem;
                      return (
                        <TableCell key={action} className="text-center">
                          <Checkbox
                            checked={isChecked}
                            disabled={isDisabled}
                            onCheckedChange={() => handleTogglePermission(perm.id)}
                            className={cn(
                              isDisabled && "opacity-50 cursor-not-allowed"
                            )}
                          />
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
