import { prisma } from "@/lib/prisma";
import { errors } from "@/lib/errors";

export async function listRoles(tenantId: string) {
  return prisma.role.findMany({
    where: { tenantId },
    include: {
      rolePermissions: {
        include: { permission: true },
      },
      _count: {
        select: { userTenants: true },
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function getRole(roleId: string, tenantId: string) {
  const role = await prisma.role.findFirst({
    where: { id: roleId, tenantId },
    include: {
      rolePermissions: {
        include: { permission: true },
      },
    },
  });

  if (!role) throw errors.notFound("ไม่พบ Role");
  return role;
}

interface CreateRoleParams {
  tenantId: string;
  name: string;
  description?: string;
  permissionIds: string[];
}

export async function createRole(params: CreateRoleParams) {
  const { tenantId, name, description, permissionIds } = params;

  // Check uniqueness
  const existing = await prisma.role.findFirst({
    where: { tenantId, name },
  });
  if (existing) throw errors.conflict("ชื่อ Role ซ้ำ");

  return prisma.role.create({
    data: {
      tenantId,
      name,
      description,
      rolePermissions: {
        create: permissionIds.map((permissionId) => ({ permissionId })),
      },
    },
    include: {
      rolePermissions: { include: { permission: true } },
    },
  });
}

export async function updateRolePermissions(
  roleId: string,
  tenantId: string,
  permissionIds: string[]
) {
  const role = await prisma.role.findFirst({
    where: { id: roleId, tenantId },
  });

  if (!role) throw errors.notFound("ไม่พบ Role");
  if (role.isSystem) throw errors.forbidden("ไม่สามารถแก้ไข Role ระบบ");

  // Delete existing and recreate
  await prisma.$transaction([
    prisma.rolePermission.deleteMany({ where: { roleId } }),
    ...permissionIds.map((permissionId) =>
      prisma.rolePermission.create({
        data: { roleId, permissionId },
      })
    ),
  ]);

  return getRole(roleId, tenantId);
}

export async function listPermissions() {
  return prisma.permission.findMany({
    orderBy: [{ module: "asc" }, { action: "asc" }],
  });
}
