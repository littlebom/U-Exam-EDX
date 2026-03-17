import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth-utils";
import { errors } from "@/lib/errors";

interface RegisterParams {
  name: string;
  email: string;
  password: string;
  tenantName: string;
}

interface RegisterResult {
  userId: string;
  tenantId: string;
}

export async function registerUser(params: RegisterParams): Promise<RegisterResult> {
  const { name, email, password, tenantName } = params;
  const emailLower = email.toLowerCase();

  // Check uniqueness
  const existing = await prisma.user.findUnique({
    where: { email: emailLower },
  });
  if (existing) {
    throw errors.conflict("อีเมลนี้ถูกใช้งานแล้ว");
  }

  const passwordHash = await hashPassword(password);

  // Create tenant, user, roles, and link in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // 1. Create Tenant
    const slug = tenantName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 100);

    const tenant = await tx.tenant.create({
      data: {
        name: tenantName,
        slug: `${slug}-${Date.now().toString(36)}`,
      },
    });

    // 2. Create all default roles for this tenant
    const allPermissions = await tx.permission.findMany();
    const permissionMap = new Map(allPermissions.map((p) => [p.code, p.id]));

    const roleDefinitions = getDefaultRoles();
    let ownerRoleId = "";

    for (const roleDef of roleDefinitions) {
      const permIds = roleDef.allPermissions
        ? allPermissions.map((p) => p.id)
        : roleDef.permissions
            .map((code) => permissionMap.get(code))
            .filter((id): id is string => !!id);

      const role = await tx.role.create({
        data: {
          tenantId: tenant.id,
          name: roleDef.name,
          description: roleDef.description,
          isSystem: true,
          rolePermissions: {
            create: permIds.map((permissionId) => ({ permissionId })),
          },
        },
      });

      if (roleDef.name === "TENANT_OWNER") {
        ownerRoleId = role.id;
      }
    }

    // 3. Create User
    const user = await tx.user.create({
      data: {
        email: emailLower,
        passwordHash,
        name,
        provider: "credentials",
      },
    });

    // 4. Link User to Tenant as Owner
    await tx.userTenant.create({
      data: {
        userId: user.id,
        tenantId: tenant.id,
        roleId: ownerRoleId,
        isDefault: true,
      },
    });

    return { userId: user.id, tenantId: tenant.id };
  });

  return result;
}

function getDefaultRoles() {
  return [
    {
      name: "TENANT_OWNER",
      description: "เจ้าของ workspace จัดการทุกอย่างภายใน",
      allPermissions: true,
      permissions: [],
    },
    {
      name: "ADMIN",
      description: "ผู้ดูแลระบบ จัดการองค์กร ตารางสอบ อนุมัติ",
      allPermissions: false,
      permissions: [
        "user:list", "user:create", "user:update", "user:delete", "user:roles",
        "exam:list", "exam:create", "exam:update", "exam:delete", "exam:publish", "exam:schedule",
        "question:list", "question:create", "question:update", "question:delete", "question:import",
        "session:list", "session:manage",
        "grading:list", "grading:grade", "grading:approve", "grading:appeal",
        "center:list", "center:create", "center:update", "center:manage",
        "registration:list", "registration:approve", "registration:cancel",
        "payment:list", "payment:refund", "payment:invoice",
        "certificate:list", "certificate:create", "certificate:template", "certificate:verify",
        "analytics:view", "analytics:export",
        "notification:manage", "notification:template",
        "proctoring:monitor", "proctoring:incident",
        "settings:api-keys", "settings:webhooks", "settings:ewallet",
        "tenant:settings",
      ],
    },
    {
      name: "EXAM_CREATOR",
      description: "สร้างข้อสอบ จัดสอบ ตรวจข้อสอบ",
      allPermissions: false,
      permissions: [
        "exam:list", "exam:create", "exam:update", "exam:delete", "exam:publish", "exam:schedule",
        "question:list", "question:create", "question:update", "question:delete", "question:import",
        "session:list", "grading:list",
      ],
    },
    {
      name: "GRADER",
      description: "ช่วยตรวจข้อสอบอัตนัย สิทธิ์จำกัด",
      allPermissions: false,
      permissions: [
        "grading:list", "grading:grade", "grading:approve", "grading:appeal",
        "exam:list", "question:list",
      ],
    },
    {
      name: "PROCTOR",
      description: "ผู้คุมสอบ คุมสอบออนไลน์/onsite",
      allPermissions: false,
      permissions: [
        "session:list", "session:proctor",
        "proctoring:monitor", "proctoring:incident",
      ],
    },
    {
      name: "CENTER_MANAGER",
      description: "ผู้จัดการศูนย์สอบ",
      allPermissions: false,
      permissions: [
        "center:list", "center:create", "center:update", "center:manage",
        "session:list", "registration:list",
      ],
    },
    {
      name: "CENTER_STAFF",
      description: "เจ้าหน้าที่ศูนย์สอบ",
      allPermissions: false,
      permissions: ["center:list", "session:list"],
    },
  ];
}
