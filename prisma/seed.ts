import { PrismaClient } from "../src/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PERMISSIONS = [
  // Auth & Tenant
  { module: "auth", action: "login", code: "auth:login", description: "เข้าสู่ระบบ" },
  { module: "tenant", action: "manage", code: "tenant:manage", description: "จัดการองค์กร" },
  { module: "tenant", action: "settings", code: "tenant:settings", description: "ตั้งค่าองค์กร" },
  // User
  { module: "user", action: "list", code: "user:list", description: "ดูรายชื่อผู้ใช้" },
  { module: "user", action: "create", code: "user:create", description: "เพิ่มผู้ใช้" },
  { module: "user", action: "update", code: "user:update", description: "แก้ไขผู้ใช้" },
  { module: "user", action: "delete", code: "user:delete", description: "ลบผู้ใช้" },
  { module: "user", action: "roles", code: "user:roles", description: "จัดการสิทธิ์" },
  // Exam
  { module: "exam", action: "list", code: "exam:list", description: "ดูรายการสอบ" },
  { module: "exam", action: "create", code: "exam:create", description: "สร้างข้อสอบ" },
  { module: "exam", action: "update", code: "exam:update", description: "แก้ไขข้อสอบ" },
  { module: "exam", action: "delete", code: "exam:delete", description: "ลบข้อสอบ" },
  { module: "exam", action: "publish", code: "exam:publish", description: "เผยแพร่ข้อสอบ" },
  { module: "exam", action: "schedule", code: "exam:schedule", description: "จัดตารางสอบ" },
  // Question
  { module: "question", action: "list", code: "question:list", description: "ดูคลังข้อสอบ" },
  { module: "question", action: "create", code: "question:create", description: "สร้างข้อสอบ" },
  { module: "question", action: "update", code: "question:update", description: "แก้ไขข้อสอบ" },
  { module: "question", action: "delete", code: "question:delete", description: "ลบข้อสอบ" },
  { module: "question", action: "import", code: "question:import", description: "Import ข้อสอบ" },
  // Session
  { module: "session", action: "list", code: "session:list", description: "ดูรอบสอบ" },
  { module: "session", action: "manage", code: "session:manage", description: "จัดการรอบสอบ" },
  { module: "session", action: "proctor", code: "session:proctor", description: "คุมสอบ" },
  // Grading
  { module: "grading", action: "list", code: "grading:list", description: "ดูรายการตรวจ" },
  { module: "grading", action: "grade", code: "grading:grade", description: "ตรวจข้อสอบ" },
  { module: "grading", action: "approve", code: "grading:approve", description: "อนุมัติผลสอบ" },
  { module: "grading", action: "appeal", code: "grading:appeal", description: "จัดการอุทธรณ์" },
  // Center
  { module: "center", action: "list", code: "center:list", description: "ดูศูนย์สอบ" },
  { module: "center", action: "create", code: "center:create", description: "สร้างศูนย์สอบ" },
  { module: "center", action: "update", code: "center:update", description: "แก้ไขศูนย์สอบ" },
  { module: "center", action: "manage", code: "center:manage", description: "จัดการศูนย์สอบ" },
  // Registration
  { module: "registration", action: "list", code: "registration:list", description: "ดูรายการสมัคร" },
  { module: "registration", action: "approve", code: "registration:approve", description: "อนุมัติการสมัคร" },
  { module: "registration", action: "cancel", code: "registration:cancel", description: "ยกเลิกการสมัคร" },
  // Payment
  { module: "payment", action: "list", code: "payment:list", description: "ดูรายการชำระเงิน" },
  { module: "payment", action: "refund", code: "payment:refund", description: "คืนเงิน" },
  { module: "payment", action: "invoice", code: "payment:invoice", description: "จัดการใบเสร็จ" },
  // Certificate
  { module: "certificate", action: "list", code: "certificate:list", description: "ดูใบรับรอง" },
  { module: "certificate", action: "create", code: "certificate:create", description: "ออกใบรับรอง" },
  { module: "certificate", action: "template", code: "certificate:template", description: "จัดการเทมเพลต" },
  { module: "certificate", action: "verify", code: "certificate:verify", description: "ตรวจสอบใบรับรอง" },
  // Analytics
  { module: "analytics", action: "view", code: "analytics:view", description: "ดูรายงาน" },
  { module: "analytics", action: "export", code: "analytics:export", description: "Export รายงาน" },
  // Notification
  { module: "notification", action: "manage", code: "notification:manage", description: "จัดการแจ้งเตือน" },
  { module: "notification", action: "template", code: "notification:template", description: "จัดการเทมเพลตแจ้งเตือน" },
  // Proctoring
  { module: "proctoring", action: "monitor", code: "proctoring:monitor", description: "คุมสอบออนไลน์" },
  { module: "proctoring", action: "incident", code: "proctoring:incident", description: "จัดการเหตุการณ์" },
  // Settings
  { module: "settings", action: "api-keys", code: "settings:api-keys", description: "จัดการ API Keys" },
  { module: "settings", action: "webhooks", code: "settings:webhooks", description: "จัดการ Webhooks" },
  { module: "settings", action: "ewallet", code: "settings:ewallet", description: "ตั้งค่า e-Wallet" },
];

const ROLE_DEFINITIONS = [
  {
    name: "PLATFORM_ADMIN",
    description: "ผู้ดูแลแพลตฟอร์ม จัดการทุกอย่าง",
    allPermissions: true,
    permissions: [] as string[],
  },
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
    permissions: PERMISSIONS.filter((p) => p.code !== "tenant:manage").map((p) => p.code),
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
    description: "ช่วยตรวจข้อสอบอัตนัย",
    allPermissions: false,
    permissions: [
      "grading:list", "grading:grade", "grading:approve", "grading:appeal",
      "exam:list", "question:list",
    ],
  },
  {
    name: "PROCTOR",
    description: "ผู้คุมสอบ",
    allPermissions: false,
    permissions: ["session:list", "session:proctor", "proctoring:monitor", "proctoring:incident"],
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
  {
    name: "CANDIDATE",
    description: "ผู้สมัครสอบ — สมัคร ทำข้อสอบ ดูผล",
    allPermissions: false,
    permissions: [],
  },
];

async function seed() {
  console.log("🌱 Seeding database...");

  // 1. Create all permissions
  console.log("Creating permissions...");
  for (const perm of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: {},
      create: perm,
    });
  }
  console.log(`  ✅ ${PERMISSIONS.length} permissions created`);

  // 2. Create default tenant
  console.log("Creating default tenant...");
  const tenant = await prisma.tenant.upsert({
    where: { slug: "u-exam-demo" },
    update: {},
    create: {
      name: "U-Exam Demo",
      slug: "u-exam-demo",
      plan: "enterprise",
    },
  });
  console.log(`  ✅ Tenant: ${tenant.name} (${tenant.id})`);

  // 3. Create roles with permissions
  console.log("Creating roles...");
  const allPermissions = await prisma.permission.findMany();
  const permCodeToId = new Map(allPermissions.map((p) => [p.code, p.id]));

  const roleMap = new Map<string, string>();

  for (const roleDef of ROLE_DEFINITIONS) {
    const permIds = roleDef.allPermissions
      ? allPermissions.map((p) => p.id)
      : roleDef.permissions
          .map((code) => permCodeToId.get(code))
          .filter((id): id is string => !!id);

    // Check if role exists
    const existing = await prisma.role.findFirst({
      where: { tenantId: tenant.id, name: roleDef.name },
    });

    if (existing) {
      roleMap.set(roleDef.name, existing.id);
      continue;
    }

    const role = await prisma.role.create({
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

    roleMap.set(roleDef.name, role.id);
    console.log(`  ✅ Role: ${roleDef.name} (${permIds.length} permissions)`);
  }

  // 4. Create admin user
  console.log("Creating admin user...");
  const adminEmail = "admin@u-exam.com";
  const adminPassword = await bcrypt.hash("password123", 12);

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: adminPassword,
        name: "Admin Demo",
        provider: "credentials",
        emailVerified: true,
      },
    });

    await prisma.userTenant.create({
      data: {
        userId: adminUser.id,
        tenantId: tenant.id,
        roleId: roleMap.get("TENANT_OWNER")!,
        isDefault: true,
      },
    });

    console.log(`  ✅ Admin: ${adminEmail} / password123`);
  } else {
    // Ensure UserTenant exists and is active (fix for re-seed after soft-delete)
    await prisma.userTenant.upsert({
      where: {
        userId_tenantId: {
          userId: existingAdmin.id,
          tenantId: tenant.id,
        },
      },
      update: {
        isActive: true,
        roleId: roleMap.get("TENANT_OWNER")!,
      },
      create: {
        userId: existingAdmin.id,
        tenantId: tenant.id,
        roleId: roleMap.get("TENANT_OWNER")!,
        isDefault: true,
      },
    });
    console.log(`  ✅ Admin already exists — UserTenant ensured active`);
  }

  // 5. Create sample users for testing
  const sampleUsers = [
    { name: "สมชาย ผู้สร้างข้อสอบ", email: "creator@u-exam.com", role: "EXAM_CREATOR" },
    { name: "สมหญิง ผู้ตรวจ", email: "grader@u-exam.com", role: "GRADER" },
    { name: "สมศักดิ์ ผู้คุมสอบ", email: "proctor@u-exam.com", role: "PROCTOR" },
    { name: "สมใจ ผู้จัดการศูนย์", email: "center@u-exam.com", role: "CENTER_MANAGER" },
    { name: "นักสอบ ตัวอย่าง", email: "candidate@u-exam.com", role: "CANDIDATE" },
    { name: "ผู้สอบ ทดสอบ", email: "candidate2@u-exam.com", role: "CANDIDATE" },
    { name: "สมปอง เข้าสอบ", email: "candidate3@u-exam.com", role: "CANDIDATE" },
  ];

  for (const sample of sampleUsers) {
    const existing = await prisma.user.findUnique({
      where: { email: sample.email },
    });

    if (!existing) {
      const user = await prisma.user.create({
        data: {
          email: sample.email,
          passwordHash: adminPassword,
          name: sample.name,
          provider: "credentials",
          emailVerified: true,
        },
      });

      await prisma.userTenant.create({
        data: {
          userId: user.id,
          tenantId: tenant.id,
          roleId: roleMap.get(sample.role)!,
          isDefault: true,
        },
      });

      console.log(`  ✅ ${sample.name} (${sample.email})`);
    } else {
      // Ensure UserTenant exists and is active (fix for re-seed after soft-delete)
      await prisma.userTenant.upsert({
        where: {
          userId_tenantId: {
            userId: existing.id,
            tenantId: tenant.id,
          },
        },
        update: {
          isActive: true,
          roleId: roleMap.get(sample.role)!,
        },
        create: {
          userId: existing.id,
          tenantId: tenant.id,
          roleId: roleMap.get(sample.role)!,
          isDefault: true,
        },
      });
      console.log(`  ✅ ${sample.name} — UserTenant ensured active`);
    }
  }

  // ============================================================
  // Cleanup: Delete all non-auth seed data (Phases 2–22)
  // Order: reverse FK dependencies
  // ============================================================
  console.log("\n🧹 Cleaning up existing seed data (Phases 2–22)...");

  // Phase 22: Integration
  await prisma.webhookLog.deleteMany({});
  await prisma.webhook.deleteMany({});
  await prisma.apiKey.deleteMany({});

  // Phase 21: Proctoring
  await prisma.proctoringEvent.deleteMany({});
  await prisma.proctoringSession.deleteMany({});
  await prisma.incident.deleteMany({});

  // Phase 20: Certificates
  await prisma.certificate.deleteMany({});
  await prisma.digitalBadge.deleteMany({});
  await prisma.certificateTemplate.deleteMany({});

  // Phase 18-19: e-Profile & e-Wallet
  await prisma.ewalletTransaction.deleteMany({});
  await prisma.ewalletConnection.deleteMany({});
  await prisma.candidateProfile.deleteMany({});

  // Phase 14-17: Exam Day & Operations
  await prisma.examDayLog.deleteMany({});
  await prisma.centerApproval.deleteMany({});

  // Phase 13: Payment
  await prisma.couponUsage.deleteMany({});
  await prisma.coupon.deleteMany({});
  await prisma.refund.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.payment.deleteMany({});

  // Phase 10-12: Test Center & Registration
  await prisma.registration.deleteMany({});
  await prisma.voucher.deleteMany({});
  await prisma.staffShift.deleteMany({});
  await prisma.centerStaff.deleteMany({});
  await prisma.equipment.deleteMany({});
  await prisma.seat.deleteMany({});
  await prisma.room.deleteMany({});
  await prisma.building.deleteMany({});
  await prisma.testCenter.deleteMany({});

  // Phase 5: Grading
  await prisma.appeal.deleteMany({});
  await prisma.gradeAnswer.deleteMany({});
  await prisma.grade.deleteMany({});
  await prisma.rubricCriteria.deleteMany({});
  await prisma.rubric.deleteMany({});

  // Phase 3-4: Exams & Sessions
  await prisma.examEvent.deleteMany({});
  await prisma.examAnswer.deleteMany({});
  await prisma.examSession.deleteMany({});
  await prisma.examSectionQuestion.deleteMany({});
  await prisma.examSection.deleteMany({});
  await prisma.examBlueprint.deleteMany({});
  await prisma.examAccess.deleteMany({});
  await prisma.examSchedule.deleteMany({});
  await prisma.exam.deleteMany({});

  // Phase 2: Question Bank
  await prisma.questionHistory.deleteMany({});
  await prisma.questionMedia.deleteMany({});
  await prisma.questionTag.deleteMany({});
  await prisma.question.deleteMany({});
  await prisma.mediaFile.deleteMany({});
  await prisma.questionGroup.deleteMany({});
  await prisma.tag.deleteMany({});
  await prisma.subject.deleteMany({});
  await prisma.category.deleteMany({});

  console.log("  ✅ All non-auth data cleaned up\n");

  // ============================================================
  // Phase 2: Question Bank Seed Data
  // ============================================================

  // 6. Create categories
  console.log("Creating categories...");
  const adminUser = await prisma.user.findUnique({ where: { email: adminEmail } });
  const creatorUser = await prisma.user.findUnique({ where: { email: "creator@u-exam.com" } });

  const categoryData = [
    { name: "เทคโนโลยีสารสนเทศ", description: "Information Technology" },
    { name: "เครือข่ายคอมพิวเตอร์", description: "Computer Networks" },
    { name: "ฐานข้อมูล", description: "Database" },
    { name: "ความปลอดภัยสารสนเทศ", description: "Information Security" },
    { name: "การเขียนโปรแกรม", description: "Programming" },
  ];

  const categoryMap = new Map<string, string>();

  for (let i = 0; i < categoryData.length; i++) {
    const cat = categoryData[i];
    const created = await prisma.category.create({
      data: {
        tenantId: tenant.id,
        name: cat.name,
        description: cat.description,
        sortOrder: i,
      },
    });
    categoryMap.set(cat.name, created.id);
    console.log(`  ✅ Category: ${cat.name}`);
  }

  // 6b. Create subjects (วิชา) — each maps to a parent category
  console.log("Creating subjects...");

  const subjectData = [
    {
      code: "IT101",
      name: "เทคโนโลยีสารสนเทศ",
      description: "วิชาพื้นฐานด้าน Information Technology ครอบคลุมระบบปฏิบัติการ สถาปัตยกรรม การจัดการ IT และ Cloud",
      color: "#3B82F6",
      categoryName: "เทคโนโลยีสารสนเทศ",
    },
    {
      code: "NET201",
      name: "เครือข่ายคอมพิวเตอร์",
      description: "Computer Networks ครอบคลุม TCP/IP, OSI Model, Routing, Switching และ Wireless",
      color: "#10B981",
      categoryName: "เครือข่ายคอมพิวเตอร์",
    },
    {
      code: "DB301",
      name: "ฐานข้อมูล",
      description: "Database ครอบคลุม SQL, NoSQL, Database Design และ Data Warehousing",
      color: "#F59E0B",
      categoryName: "ฐานข้อมูล",
    },
    {
      code: "SEC401",
      name: "ความปลอดภัยสารสนเทศ",
      description: "Information Security ครอบคลุม Cryptography, Ethical Hacking และ Incident Response",
      color: "#EF4444",
      categoryName: "ความปลอดภัยสารสนเทศ",
    },
    {
      code: "PRG501",
      name: "การเขียนโปรแกรม",
      description: "Programming ครอบคลุม Python, JavaScript, Java และ อัลกอริทึม",
      color: "#8B5CF6",
      categoryName: "การเขียนโปรแกรม",
    },
  ];

  const subjectMap = new Map<string, string>();

  for (let i = 0; i < subjectData.length; i++) {
    const s = subjectData[i];
    const catId = categoryMap.get(s.categoryName) ?? null;
    const subject = await prisma.subject.create({
      data: {
        tenantId: tenant.id,
        code: s.code,
        name: s.name,
        description: s.description,
        color: s.color,
        categoryId: catId,
        sortOrder: i,
      },
    });
    subjectMap.set(s.categoryName, subject.id);
    console.log(`  ✅ Subject: ${s.code} — ${s.name}`);
  }

  // 7. Create tags
  console.log("Creating tags...");
  const tagData = [
    { name: "สอบใบรับรอง", color: "#EF4444" },
    { name: "พื้นฐาน", color: "#3B82F6" },
    { name: "ขั้นสูง", color: "#8B5CF6" },
    { name: "ข้อสอบเก่า", color: "#6B7280" },
    { name: "สอบประจำปี", color: "#F59E0B" },
    { name: "แนะนำ", color: "#10B981" },
    { name: "เตรียมสอบ", color: "#EC4899" },
    { name: "ปฏิบัติ", color: "#14B8A6" },
  ];

  const tagMap = new Map<string, string>();
  for (const t of tagData) {
    const tag = await prisma.tag.create({
      data: { tenantId: tenant.id, name: t.name, color: t.color },
    });
    tagMap.set(t.name, tag.id);
  }
  console.log(`  ✅ ${tagData.length} tags created`);

  // 8. Create sample questions
  console.log("Creating sample questions...");

  const createdById = creatorUser?.id ?? adminUser!.id;

  // Helper: convert plain text to Tiptap doc JSON
  const toTiptapDoc = (text: string) => ({
    type: "doc",
    content: [{ type: "paragraph", content: [{ type: "text", text }] }],
  });

  const questionData = [
    {
      type: "MULTIPLE_CHOICE",
      difficulty: "EASY",
      content: { type: "text", text: "โปรโตคอล HTTP ใช้หมายเลข Port ใดเป็นค่าเริ่มต้น?" },
      options: [
        { id: "a", text: "Port 21" },
        { id: "b", text: "Port 80" },
        { id: "c", text: "Port 443" },
        { id: "d", text: "Port 8080" },
      ],
      correctAnswer: { answerId: "b" },
      explanation: "HTTP ใช้ Port 80 เป็นค่าเริ่มต้น ส่วน HTTPS ใช้ Port 443",
      points: 1,
      categoryName: "เครือข่ายคอมพิวเตอร์",
      tags: ["พื้นฐาน", "สอบใบรับรอง"],
      status: "ACTIVE",
    },
    {
      type: "MULTIPLE_CHOICE",
      difficulty: "MEDIUM",
      content: { type: "text", text: "ในภาษา SQL คำสั่ง JOIN ชนิดใดที่คืนค่าเฉพาะแถวที่มีข้อมูลตรงกันในทั้งสองตาราง?" },
      options: [
        { id: "a", text: "LEFT JOIN" },
        { id: "b", text: "RIGHT JOIN" },
        { id: "c", text: "INNER JOIN" },
        { id: "d", text: "FULL OUTER JOIN" },
      ],
      correctAnswer: { answerId: "c" },
      explanation: "INNER JOIN คืนค่าเฉพาะแถวที่มีข้อมูลตรงกันในทั้งสองตาราง",
      points: 2,
      categoryName: "ฐานข้อมูล",
      tags: ["พื้นฐาน"],
      status: "ACTIVE",
    },
    {
      type: "TRUE_FALSE",
      difficulty: "EASY",
      content: { type: "text", text: "TCP (Transmission Control Protocol) เป็น Connection-oriented Protocol ใช่หรือไม่?" },
      options: [
        { id: "true", text: "ใช่ (True)" },
        { id: "false", text: "ไม่ใช่ (False)" },
      ],
      correctAnswer: { answerId: "true" },
      explanation: "TCP เป็น Connection-oriented Protocol ที่สร้าง connection ก่อนส่งข้อมูล (3-way handshake)",
      points: 1,
      categoryName: "เครือข่ายคอมพิวเตอร์",
      tags: ["พื้นฐาน"],
      status: "ACTIVE",
    },
    {
      type: "TRUE_FALSE",
      difficulty: "MEDIUM",
      content: { type: "text", text: "ในหลักการ REST API เมธอด PUT เป็น Idempotent ใช่หรือไม่?" },
      options: [
        { id: "true", text: "ใช่ (True)" },
        { id: "false", text: "ไม่ใช่ (False)" },
      ],
      correctAnswer: { answerId: "true" },
      explanation: "PUT เป็น Idempotent — การเรียก PUT ซ้ำๆ ด้วยข้อมูลเดิม ผลลัพธ์จะเหมือนเดิมเสมอ",
      points: 1,
      categoryName: "เทคโนโลยีสารสนเทศ",
      tags: ["เตรียมสอบ"],
      status: "ACTIVE",
    },
    {
      type: "SHORT_ANSWER",
      difficulty: "MEDIUM",
      content: { type: "text", text: "อัลกอริทึม Binary Search มี Time Complexity แบบ Big-O Notation เท่ากับเท่าไร?" },
      options: null,
      correctAnswer: { answers: ["O(log n)", "O(logn)", "O(log(n))"] },
      explanation: "Binary Search แบ่งครึ่งข้อมูลในแต่ละขั้น จึงมี Time Complexity O(log n)",
      points: 2,
      categoryName: "การเขียนโปรแกรม",
      tags: ["พื้นฐาน", "สอบใบรับรอง"],
      status: "ACTIVE",
    },
    {
      type: "ESSAY",
      difficulty: "HARD",
      content: { type: "text", text: "จงเปรียบเทียบข้อดีข้อเสียของ Microservices Architecture กับ Monolithic Architecture พร้อมยกตัวอย่างกรณีที่เหมาะสมกับแต่ละรูปแบบ" },
      options: null,
      correctAnswer: null,
      explanation: null,
      points: 10,
      categoryName: "เทคโนโลยีสารสนเทศ",
      tags: ["ขั้นสูง"],
      status: "ACTIVE",
    },
    {
      type: "ESSAY",
      difficulty: "HARD",
      content: { type: "text", text: "จงอธิบายหลักการ Database Normalization ตั้งแต่ First Normal Form (1NF) จนถึง Third Normal Form (3NF) พร้อมยกตัวอย่างประกอบ" },
      options: null,
      correctAnswer: null,
      explanation: null,
      points: 10,
      categoryName: "ฐานข้อมูล",
      tags: ["ขั้นสูง", "สอบใบรับรอง"],
      status: "ACTIVE",
    },
    {
      type: "FILL_IN_BLANK",
      difficulty: "EASY",
      content: { type: "text", text: "ใน HTML5 แท็ก ___ ใช้สำหรับส่วนหัวของเว็บ และแท็ก ___ ใช้สำหรับส่วนท้ายของเว็บ" },
      options: null,
      correctAnswer: { blanks: ["<header>", "<footer>"] },
      explanation: "<header> สำหรับส่วนหัว และ <footer> สำหรับส่วนท้ายของเว็บไซต์",
      points: 2,
      categoryName: "การเขียนโปรแกรม",
      tags: ["พื้นฐาน"],
      status: "ACTIVE",
    },
    {
      type: "MATCHING",
      difficulty: "MEDIUM",
      content: { type: "text", text: "จงจับคู่ HTTP Status Code ต่อไปนี้กับความหมายที่ถูกต้อง" },
      options: {
        left: ["200", "301", "404", "500"],
        right: ["OK", "Moved Permanently", "Not Found", "Internal Server Error"],
      },
      correctAnswer: { pairs: [["200", "OK"], ["301", "Moved Permanently"], ["404", "Not Found"], ["500", "Internal Server Error"]] },
      explanation: "HTTP Status Codes แบ่งเป็น 5 กลุ่ม: 1xx (Info), 2xx (Success), 3xx (Redirect), 4xx (Client Error), 5xx (Server Error)",
      points: 4,
      categoryName: "เครือข่ายคอมพิวเตอร์",
      tags: ["เตรียมสอบ"],
      status: "ACTIVE",
    },
    {
      type: "ORDERING",
      difficulty: "MEDIUM",
      content: { type: "text", text: "จงเรียงลำดับ OSI Model 7 Layers จากล่างสุด (Layer 1) ไปบนสุด (Layer 7)" },
      options: null,
      correctAnswer: { order: ["Physical", "Data Link", "Network", "Transport", "Session", "Presentation", "Application"] },
      explanation: "OSI Model 7 Layers: Physical → Data Link → Network → Transport → Session → Presentation → Application",
      points: 3,
      categoryName: "เครือข่ายคอมพิวเตอร์",
      tags: ["พื้นฐาน", "สอบใบรับรอง"],
      status: "ACTIVE",
    },
    {
      type: "MULTIPLE_CHOICE",
      difficulty: "MEDIUM",
      content: { type: "text", text: "Singleton Design Pattern มีลักษณะเฉพาะอย่างไร?" },
      options: [
        { id: "a", text: "สร้าง Object ได้หลาย Instance" },
        { id: "b", text: "จำกัดการสร้าง Object ให้มีได้เพียง 1 Instance" },
        { id: "c", text: "ใช้สำหรับสร้าง Object จาก Template" },
        { id: "d", text: "ใช้สำหรับ Clone Object" },
      ],
      correctAnswer: { answerId: "b" },
      explanation: "Singleton Pattern จำกัดให้ Class มี Instance เดียว และ provide global access point",
      points: 2,
      categoryName: "เทคโนโลยีสารสนเทศ",
      tags: ["เตรียมสอบ", "ขั้นสูง"],
      status: "ACTIVE",
    },
    {
      type: "MULTIPLE_CHOICE",
      difficulty: "EASY",
      content: { type: "text", text: "โครงสร้างข้อมูลแบบ Stack ทำงานตามหลักการใด?" },
      options: [
        { id: "a", text: "FIFO (First In, First Out)" },
        { id: "b", text: "LIFO (Last In, First Out)" },
        { id: "c", text: "Priority-based" },
        { id: "d", text: "Random Access" },
      ],
      correctAnswer: { answerId: "b" },
      explanation: "Stack ทำงานแบบ LIFO — ข้อมูลที่ใส่เข้าไปทีหลังจะถูกนำออกก่อน",
      points: 1,
      categoryName: "การเขียนโปรแกรม",
      tags: ["พื้นฐาน"],
      status: "ACTIVE",
    },
    {
      type: "ORDERING",
      difficulty: "MEDIUM",
      content: { type: "text", text: "จงเรียงลำดับขั้นตอนของ Software Development Life Cycle (SDLC) แบบ Waterfall" },
      options: null,
      correctAnswer: { order: ["Requirements", "Design", "Implementation", "Testing", "Deployment", "Maintenance"] },
      explanation: "SDLC Waterfall: Requirements → Design → Implementation → Testing → Deployment → Maintenance",
      points: 3,
      categoryName: "เทคโนโลยีสารสนเทศ",
      tags: ["สอบใบรับรอง"],
      status: "ACTIVE",
    },
    {
      type: "SHORT_ANSWER",
      difficulty: "EASY",
      content: { type: "text", text: "ใน CSS Box Model ส่วน Padding อยู่ระหว่างส่วนใดกับส่วนใด?" },
      options: null,
      correctAnswer: { answers: ["content กับ border", "Content และ Border", "content และ border"] },
      explanation: "CSS Box Model: content → padding → border → margin (Padding อยู่ระหว่าง content กับ border)",
      points: 1,
      categoryName: "การเขียนโปรแกรม",
      tags: ["พื้นฐาน"],
      status: "ACTIVE",
    },
    {
      type: "MULTIPLE_CHOICE",
      difficulty: "HARD",
      content: { type: "text", text: "สำหรับข้อมูลที่มีความสัมพันธ์ซับซ้อนแบบ Graph ควรเลือกใช้ NoSQL Database ชนิดใด?" },
      options: [
        { id: "a", text: "MongoDB (Document Store)" },
        { id: "b", text: "Redis (Key-Value Store)" },
        { id: "c", text: "Neo4j (Graph Database)" },
        { id: "d", text: "Cassandra (Column Family)" },
      ],
      correctAnswer: { answerId: "c" },
      explanation: "Neo4j เป็น Graph Database ที่ออกแบบมาเพื่อจัดการข้อมูลแบบ Graph โดยเฉพาะ",
      points: 2,
      categoryName: "ฐานข้อมูล",
      tags: ["ขั้นสูง"],
      status: "ACTIVE",
    },
    {
      type: "FILL_IN_BLANK",
      difficulty: "EASY",
      content: { type: "text", text: "คำสั่ง git ___ ใช้สำหรับสร้าง branch ใหม่ และคำสั่ง git ___ ใช้สำหรับรวม branch" },
      options: null,
      correctAnswer: { blanks: ["branch", "merge"] },
      explanation: "git branch สร้าง branch ใหม่, git merge รวม branch เข้าด้วยกัน",
      points: 2,
      categoryName: "เทคโนโลยีสารสนเทศ",
      tags: ["พื้นฐาน", "ปฏิบัติ"],
      status: "ACTIVE",
    },
    {
      type: "MATCHING",
      difficulty: "MEDIUM",
      content: { type: "text", text: "จงจับคู่ภาษาโปรแกรมกับ Programming Paradigm หลักของภาษา" },
      options: {
        left: ["Haskell", "Java", "C", "Prolog"],
        right: ["Functional", "Object-Oriented", "Procedural", "Logic"],
      },
      correctAnswer: { pairs: [["Haskell", "Functional"], ["Java", "Object-Oriented"], ["C", "Procedural"], ["Prolog", "Logic"]] },
      explanation: "Haskell เป็น Functional, Java เป็น OOP, C เป็น Procedural, Prolog เป็น Logic programming",
      points: 4,
      categoryName: "การเขียนโปรแกรม",
      tags: ["เตรียมสอบ"],
      status: "ACTIVE",
    },
    {
      type: "MULTIPLE_CHOICE",
      difficulty: "MEDIUM",
      content: { type: "text", text: "AES (Advanced Encryption Standard) เป็นการเข้ารหัสแบบใด?" },
      options: [
        { id: "a", text: "Asymmetric Encryption" },
        { id: "b", text: "Symmetric Encryption" },
        { id: "c", text: "Hash Function" },
        { id: "d", text: "Digital Signature" },
      ],
      correctAnswer: { answerId: "b" },
      explanation: "AES เป็น Symmetric Encryption ที่ใช้กุญแจเดียวกันในการเข้ารหัสและถอดรหัส",
      points: 2,
      categoryName: "ความปลอดภัยสารสนเทศ",
      tags: ["สอบใบรับรอง"],
      status: "ACTIVE",
    },
    {
      type: "IMAGE_BASED",
      difficulty: "MEDIUM",
      content: { type: "text", text: "จาก ER Diagram ที่กำหนด ความสัมพันธ์ระหว่าง Entity A กับ Entity B เป็นแบบใด?" },
      options: [
        { id: "a", text: "One-to-One" },
        { id: "b", text: "One-to-Many" },
        { id: "c", text: "Many-to-Many" },
        { id: "d", text: "Self-referencing" },
      ],
      correctAnswer: { answerId: "b" },
      explanation: "จาก ER Diagram ที่แสดง ความสัมพันธ์เป็นแบบ One-to-Many",
      points: 2,
      categoryName: "ฐานข้อมูล",
      tags: ["เตรียมสอบ"],
      status: "ACTIVE",
    },
    {
      type: "TRUE_FALSE",
      difficulty: "EASY",
      content: { type: "text", text: "ภาษา Python เป็น Interpreted Language ใช่หรือไม่?" },
      options: [
        { id: "true", text: "ใช่ (True)" },
        { id: "false", text: "ไม่ใช่ (False)" },
      ],
      correctAnswer: { answerId: "true" },
      explanation: "Python เป็น Interpreted Language — code ถูก execute ทีละบรรทัดโดย Python interpreter",
      points: 1,
      categoryName: "การเขียนโปรแกรม",
      tags: ["พื้นฐาน"],
      status: "DRAFT",
    },
    // ── Math questions (Tiptap JSON with KaTeX) ──
    {
      type: "SHORT_ANSWER",
      difficulty: "MEDIUM",
      content: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              { type: "text", text: "กำหนดให้ " },
              { type: "mathInline", attrs: { latex: "f(x) = 2x^2 + 3x - 5" } },
              { type: "text", text: " จงหาค่า " },
              { type: "mathInline", attrs: { latex: "f(2)" } },
            ],
          },
        ],
      },
      options: null,
      correctAnswer: { answers: ["9"] },
      explanation: "f(2) = 2(2)² + 3(2) - 5 = 2(4) + 6 - 5 = 8 + 6 - 5 = 9",
      points: 2,
      categoryName: "การเขียนโปรแกรม",
      tags: ["เตรียมสอบ"],
      status: "ACTIVE",
      searchText: "กำหนดให้ f(x) = 2x^2 + 3x - 5 จงหาค่า f(2)",
    },
    {
      type: "MULTIPLE_CHOICE",
      difficulty: "HARD",
      content: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              { type: "text", text: "อัลกอริทึม Quick Sort มี Average Time Complexity เท่ากับข้อใด?" },
            ],
          },
          {
            type: "paragraph",
            content: [
              { type: "text", text: "โดยที่ " },
              { type: "mathInline", attrs: { latex: "n" } },
              { type: "text", text: " คือจำนวนสมาชิกใน Array" },
            ],
          },
        ],
      },
      options: [
        { id: "a", text: "O(n)" },
        { id: "b", text: "O(n log n)" },
        { id: "c", text: "O(n²)" },
        { id: "d", text: "O(2ⁿ)" },
      ],
      correctAnswer: { answerId: "b" },
      explanation: "Quick Sort มี Average Time Complexity O(n log n) แต่ Worst Case เป็น O(n²)",
      points: 3,
      categoryName: "การเขียนโปรแกรม",
      tags: ["ขั้นสูง", "สอบใบรับรอง"],
      status: "ACTIVE",
      searchText: "อัลกอริทึม Quick Sort มี Average Time Complexity เท่ากับข้อใด? โดยที่ n คือจำนวนสมาชิกใน Array",
    },
  ];

  for (const q of questionData) {
    const subjectId = subjectMap.get(q.categoryName) ?? null;
    const questionTagIds = q.tags
      .map((t) => tagMap.get(t))
      .filter((id): id is string => !!id);

    // Convert legacy { type: "text", text: "..." } to Tiptap JSON
    const legacyContent = q.content as { type: string; text?: string };
    const tiptapContent = legacyContent.type === "text" && legacyContent.text
      ? toTiptapDoc(legacyContent.text)
      : q.content;
    const searchText = legacyContent.type === "text" && legacyContent.text
      ? legacyContent.text
      : (q as any).searchText || "";

    const question = await prisma.question.create({
      data: {
        tenantId: tenant.id,
        createdById: createdById,
        type: q.type,
        difficulty: q.difficulty,
        content: tiptapContent as any,
        options: q.options as any,
        correctAnswer: q.correctAnswer as any,
        explanation: q.explanation,
        points: q.points,
        subjectId: subjectId,
        status: q.status,
        searchText: searchText,
        questionTags: {
          create: questionTagIds.map((tagId) => ({ tagId })),
        },
      },
    });

    // Create history record
    await prisma.questionHistory.create({
      data: {
        questionId: question.id,
        changedById: createdById,
        changeType: "CREATED",
      },
    });
  }
  console.log(`  ✅ ${questionData.length} questions created`);

  // ============================================================
  // Phase 3: Exam Builder + Scheduling Seed Data
  // ============================================================

  console.log("Creating sample exams...");

  {
    const activeQuestions = await prisma.question.findMany({
      where: { tenantId: tenant.id, status: "ACTIVE" },
      select: { id: true, points: true, type: true },
    });

    // Exam 1: IT Fundamentals (PUBLISHED, with sections + questions)
    const exam1 = await prisma.exam.create({
      data: {
        tenantId: tenant.id,
        createdById: createdById,
        title: "IT Fundamentals Certification Exam",
        description: "ข้อสอบวัดความรู้พื้นฐานด้าน IT สำหรับการสอบใบรับรอง ครอบคลุมเนื้อหา Network, Database, Security และ Programming",
        status: "PUBLISHED",
        mode: "PUBLIC",
        passingScore: 60,
        duration: 90,
        settings: {
          shuffleQuestions: true,
          shuffleOptions: true,
          showResult: true,
          maxAttempts: 3,
          showExplanation: true,
        },
      },
    });

    // Create sections for exam 1
    const section1a = await prisma.examSection.create({
      data: {
        examId: exam1.id,
        title: "ส่วนที่ 1: ปรนัย (Multiple Choice)",
        description: "ข้อสอบปรนัย เลือกตอบ",
        sortOrder: 0,
      },
    });
    const section1b = await prisma.examSection.create({
      data: {
        examId: exam1.id,
        title: "ส่วนที่ 2: ถูก/ผิด & เติมคำ",
        description: "ข้อสอบ True/False และ Fill-in-the-blank",
        sortOrder: 1,
      },
    });
    const section1c = await prisma.examSection.create({
      data: {
        examId: exam1.id,
        title: "ส่วนที่ 3: อัตนัย (Essay)",
        description: "ข้อสอบอัตนัยเขียนตอบ",
        sortOrder: 2,
      },
    });

    // Add questions to sections
    const mcQuestions = activeQuestions.filter((q) => q.type === "MULTIPLE_CHOICE");
    const tfQuestions = activeQuestions.filter((q) => q.type === "TRUE_FALSE");
    const fillQuestions = activeQuestions.filter((q) => q.type === "FILL_IN_BLANK");
    const essayQuestions = activeQuestions.filter((q) => q.type === "ESSAY");

    let totalPoints = 0;

    // Section 1: MC questions
    for (let i = 0; i < Math.min(mcQuestions.length, 6); i++) {
      await prisma.examSectionQuestion.create({
        data: {
          sectionId: section1a.id,
          questionId: mcQuestions[i].id,
          sortOrder: i,
        },
      });
      totalPoints += mcQuestions[i].points;
    }

    // Section 2: TF + Fill questions
    for (let i = 0; i < Math.min(tfQuestions.length, 3); i++) {
      await prisma.examSectionQuestion.create({
        data: {
          sectionId: section1b.id,
          questionId: tfQuestions[i].id,
          sortOrder: i,
        },
      });
      totalPoints += tfQuestions[i].points;
    }
    for (let i = 0; i < Math.min(fillQuestions.length, 2); i++) {
      await prisma.examSectionQuestion.create({
        data: {
          sectionId: section1b.id,
          questionId: fillQuestions[i].id,
          sortOrder: tfQuestions.length + i,
        },
      });
      totalPoints += fillQuestions[i].points;
    }

    // Section 3: Essay questions
    for (let i = 0; i < Math.min(essayQuestions.length, 2); i++) {
      await prisma.examSectionQuestion.create({
        data: {
          sectionId: section1c.id,
          questionId: essayQuestions[i].id,
          sortOrder: i,
        },
      });
      totalPoints += essayQuestions[i].points;
    }

    // Update total points
    await prisma.exam.update({
      where: { id: exam1.id },
      data: { totalPoints },
    });

    // Create schedule for exam 1
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 15, 9, 0, 0);
    const nextMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 15, 12, 0, 0);
    const regOpen1 = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    const regDeadline = new Date(now.getFullYear(), now.getMonth() + 1, 10, 23, 59, 59);

    await prisma.examSchedule.create({
      data: {
        tenantId: tenant.id,
        examId: exam1.id,
        startDate: nextMonth,
        endDate: nextMonthEnd,
        registrationOpenDate: regOpen1,
        registrationDeadline: regDeadline,
        maxCandidates: 100,
        status: "SCHEDULED",
        location: "ห้อง A101 ศูนย์สอบกรุงเทพฯ",
      },
    });

    // Create second schedule
    const nextMonth2 = new Date(now.getFullYear(), now.getMonth() + 2, 20, 9, 0, 0);
    const nextMonth2End = new Date(now.getFullYear(), now.getMonth() + 2, 20, 12, 0, 0);

    const regOpen2 = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0);
    const regDeadline2 = new Date(now.getFullYear(), now.getMonth() + 2, 10, 23, 59, 59);
    await prisma.examSchedule.create({
      data: {
        tenantId: tenant.id,
        examId: exam1.id,
        startDate: nextMonth2,
        endDate: nextMonth2End,
        registrationOpenDate: regOpen2,
        registrationDeadline: regDeadline2,
        maxCandidates: 50,
        status: "SCHEDULED",
        location: "ห้อง 301 อาคาร B ศูนย์สอบเชียงใหม่",
      },
    });

    // Create ExamAccess for exam 1
    await prisma.examAccess.create({
      data: {
        examId: exam1.id,
        type: "PUBLIC",
      },
    });

    console.log(`  ✅ Exam 1: ${exam1.title} (${totalPoints} points, 3 sections)`);

    // Exam 2: Network Security (DRAFT)
    const exam2 = await prisma.exam.create({
      data: {
        tenantId: tenant.id,
        createdById: createdById,
        title: "Network Security Professional Exam",
        description: "ข้อสอบความปลอดภัยเครือข่ายระดับ Professional",
        status: "DRAFT",
        mode: "PUBLIC",
        passingScore: 70,
        duration: 120,
        settings: {
          shuffleQuestions: false,
          shuffleOptions: true,
          showResult: false,
          maxAttempts: 1,
        },
      },
    });
    console.log(`  ✅ Exam 2: ${exam2.title} (DRAFT)`);

    // Exam 3: Database Fundamentals (PUBLISHED)
    const exam3 = await prisma.exam.create({
      data: {
        tenantId: tenant.id,
        createdById: createdById,
        title: "Database Fundamentals",
        description: "ข้อสอบพื้นฐานฐานข้อมูล SQL และ NoSQL",
        status: "PUBLISHED",
        mode: "CORPORATE",
        passingScore: 50,
        duration: 60,
        settings: {
          shuffleQuestions: true,
          showResult: true,
          maxAttempts: 2,
        },
      },
    });

    // Create access code for exam 3 (CORPORATE)
    await prisma.examAccess.create({
      data: {
        examId: exam3.id,
        type: "CODE",
        accessCode: "DB2026",
      },
    });

    // Schedule for exam 3
    const corpDate = new Date(now.getFullYear(), now.getMonth() + 1, 25, 13, 0, 0);
    const corpDateEnd = new Date(now.getFullYear(), now.getMonth() + 1, 25, 15, 0, 0);
    const corpRegOpen = new Date(now.getFullYear(), now.getMonth(), 15, 0, 0, 0);
    const corpRegDeadline = new Date(now.getFullYear(), now.getMonth() + 1, 20, 23, 59, 59);
    await prisma.examSchedule.create({
      data: {
        tenantId: tenant.id,
        examId: exam3.id,
        startDate: corpDate,
        endDate: corpDateEnd,
        registrationOpenDate: corpRegOpen,
        registrationDeadline: corpRegDeadline,
        maxCandidates: 30,
        status: "SCHEDULED",
        location: "ห้องฝึกอบรม ชั้น 5 บริษัท ABC จำกัด",
      },
    });
    console.log(`  ✅ Exam 3: ${exam3.title} (CORPORATE, code: DB2026)`);

    // Exam 4: Programming Skills (ACTIVE, past schedule)
    const exam4 = await prisma.exam.create({
      data: {
        tenantId: tenant.id,
        createdById: createdById,
        title: "Programming Skills Assessment",
        description: "วัดทักษะการเขียนโปรแกรมเบื้องต้น",
        status: "ACTIVE",
        mode: "PUBLIC",
        passingScore: 55,
        duration: 45,
        settings: {
          shuffleQuestions: true,
          shuffleOptions: true,
          showResult: true,
          maxAttempts: 5,
          showExplanation: true,
        },
      },
    });
    console.log(`  ✅ Exam 4: ${exam4.title} (ACTIVE)`);

    // Exam 5: Completed exam
    const exam5 = await prisma.exam.create({
      data: {
        tenantId: tenant.id,
        createdById: createdById,
        title: "IT Security Basics 2025",
        description: "ข้อสอบความปลอดภัยสารสนเทศเบื้องต้น (ปิดรับสมัครแล้ว)",
        status: "COMPLETED",
        mode: "PUBLIC",
        passingScore: 60,
        duration: 60,
        totalPoints: 30,
      },
    });

    // Completed schedule
    const pastDate = new Date(now.getFullYear(), now.getMonth() - 1, 10, 9, 0, 0);
    const pastDateEnd = new Date(now.getFullYear(), now.getMonth() - 1, 10, 11, 0, 0);
    await prisma.examSchedule.create({
      data: {
        tenantId: tenant.id,
        examId: exam5.id,
        startDate: pastDate,
        endDate: pastDateEnd,
        maxCandidates: 80,
        status: "COMPLETED",
        location: "ศูนย์สอบกรุงเทพฯ",
      },
    });
    console.log(`  ✅ Exam 5: ${exam5.title} (COMPLETED)`);

    // Create blueprints for exam 2 (DRAFT — using blueprint for planning)
    const networkCatId = categoryMap.get("เครือข่ายคอมพิวเตอร์");
    const securityCatId = categoryMap.get("ความปลอดภัยสารสนเทศ");
    if (networkCatId) {
      await prisma.examBlueprint.create({
        data: {
          examId: exam2.id,
          categoryId: networkCatId,
          difficulty: "MEDIUM",
          count: 10,
          points: 2,
        },
      });
    }
    if (securityCatId) {
      await prisma.examBlueprint.create({
        data: {
          examId: exam2.id,
          categoryId: securityCatId,
          difficulty: "HARD",
          count: 5,
          points: 4,
        },
      });
    }

    console.log(`  ✅ 5 exams created with schedules and sections`);

    // ============================================================
    // Phase 4: Exam Taking Seed Data
    // ============================================================

    console.log("Creating candidate users and exam sessions...");

    // Create candidate users
    const candidateUsers = [
      { name: "วิชัย ผู้สมัครสอบ", email: "candidate1@u-exam.com" },
      { name: "สุนิสา ผู้สมัครสอบ", email: "candidate2@u-exam.com" },
      { name: "ปรีชา ผู้สมัครสอบ", email: "candidate3@u-exam.com" },
    ];

    const candidateIds: string[] = [];
    for (const c of candidateUsers) {
      const existing = await prisma.user.findUnique({ where: { email: c.email } });
      if (existing) {
        candidateIds.push(existing.id);
      } else {
        const user = await prisma.user.create({
          data: {
            email: c.email,
            passwordHash: adminPassword,
            name: c.name,
            provider: "credentials",
            emailVerified: true,
          },
        });
        // No tenant assignment for CANDIDATE role (they use a separate route)
        candidateIds.push(user.id);
        console.log(`  ✅ Candidate: ${c.name} (${c.email})`);
      }
    }

    // Create an ACTIVE schedule for exam 4 (to allow exam taking)
    const activeScheduleDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const activeScheduleEnd = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate(), 23, 59, 59);
    const activeSchedule = await prisma.examSchedule.create({
      data: {
        tenantId: tenant.id,
        examId: exam4.id,
        startDate: activeScheduleDate,
        endDate: activeScheduleEnd,
        maxCandidates: 200,
        status: "ACTIVE",
        location: "ออนไลน์",
      },
    });

    // Add some questions to exam4 with a section
    const exam4Section = await prisma.examSection.create({
      data: {
        examId: exam4.id,
        title: "ส่วนที่ 1: ข้อสอบทั่วไป",
        description: "คำถามเกี่ยวกับการเขียนโปรแกรม",
        sortOrder: 0,
      },
    });

    const progQuestions = activeQuestions.slice(0, 8);
    let exam4Points = 0;
    for (let i = 0; i < progQuestions.length; i++) {
      await prisma.examSectionQuestion.create({
        data: {
          sectionId: exam4Section.id,
          questionId: progQuestions[i].id,
          sortOrder: i,
        },
      });
      exam4Points += progQuestions[i].points;
    }
    await prisma.exam.update({
      where: { id: exam4.id },
      data: { totalPoints: exam4Points },
    });

    // Create ExamAccess for exam 4
    await prisma.examAccess.create({
      data: {
        examId: exam4.id,
        type: "PUBLIC",
      },
    });

    // Create sample exam sessions
    // Session 1: Candidate 1 completed the exam
    if (candidateIds[0]) {
      const session1 = await prisma.examSession.create({
        data: {
          examScheduleId: activeSchedule.id,
          candidateId: candidateIds[0],
          status: "SUBMITTED",
          startedAt: new Date(now.getTime() - 3600000), // 1 hour ago
          submittedAt: new Date(now.getTime() - 600000), // 10 minutes ago
          timeRemaining: 0,
          ipAddress: "192.168.1.100",
          userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
        },
      });

      // Add some answers
      for (let i = 0; i < Math.min(progQuestions.length, 5); i++) {
        await prisma.examAnswer.create({
          data: {
            sessionId: session1.id,
            questionId: progQuestions[i].id,
            answer: { answerId: "b" },
            answeredAt: new Date(now.getTime() - 3000000 + i * 120000),
            timeSpent: 60 + i * 30,
          },
        });
      }

      // Add some anti-cheat events
      await prisma.examEvent.createMany({
        data: [
          { sessionId: session1.id, type: "FOCUS", timestamp: new Date(now.getTime() - 3600000) },
          { sessionId: session1.id, type: "BLUR", timestamp: new Date(now.getTime() - 3000000) },
          { sessionId: session1.id, type: "FOCUS", timestamp: new Date(now.getTime() - 2900000) },
          { sessionId: session1.id, type: "TAB_SWITCH", timestamp: new Date(now.getTime() - 2000000) },
        ],
      });

      console.log(`  ✅ Session: ${candidateUsers[0].name} → SUBMITTED`);
    }

    // Session 2: Candidate 2 is still in progress
    if (candidateIds[1]) {
      const session2 = await prisma.examSession.create({
        data: {
          examScheduleId: activeSchedule.id,
          candidateId: candidateIds[1],
          status: "IN_PROGRESS",
          startedAt: new Date(now.getTime() - 1200000), // 20 minutes ago
          timeRemaining: 1500, // 25 minutes left
          ipAddress: "192.168.1.101",
          userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        },
      });

      // Add a few answers
      for (let i = 0; i < Math.min(progQuestions.length, 3); i++) {
        await prisma.examAnswer.create({
          data: {
            sessionId: session2.id,
            questionId: progQuestions[i].id,
            answer: { answerId: "c" },
            isFlagged: i === 1, // flag the second question
            answeredAt: new Date(now.getTime() - 1000000 + i * 60000),
            timeSpent: 45 + i * 20,
          },
        });
      }

      console.log(`  ✅ Session: ${candidateUsers[1].name} → IN_PROGRESS`);
    }

    // Session 3: Candidate 3 completed the exam (for grading queue demo)
    if (candidateIds[2]) {
      const session3 = await prisma.examSession.create({
        data: {
          examScheduleId: activeSchedule.id,
          candidateId: candidateIds[2],
          status: "SUBMITTED",
          startedAt: new Date(now.getTime() - 7200000), // 2 hours ago
          submittedAt: new Date(now.getTime() - 3600000), // 1 hour ago
          timeRemaining: 0,
          ipAddress: "192.168.1.102",
          userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        },
      });

      // Add answers for all 8 questions
      for (let i = 0; i < progQuestions.length; i++) {
        const q = progQuestions[i];
        let answer: any;
        if (q.type === "MULTIPLE_CHOICE") answer = { answerId: "c" };
        else if (q.type === "TRUE_FALSE") answer = { answerId: "true" };
        else if (q.type === "ESSAY") answer = "Microservices Architecture แบ่งแอปพลิเคชันออกเป็นบริการย่อยๆ ที่ทำงานอิสระ สื่อสารกันผ่าน API ข้อดีคือ Scale ได้อิสระ Deploy ได้แยกกัน ใช้เทคโนโลยีต่างกันได้ ข้อเสียคือ ซับซ้อนในการจัดการ Network latency และ Data consistency";
        else if (q.type === "SHORT_ANSWER") answer = "O(log n)";
        else if (q.type === "FILL_IN_BLANK") answer = ["<header>", "<footer>"];
        else if (q.type === "MATCHING") answer = { "200": "OK", "301": "Moved Permanently", "404": "Not Found", "500": "Internal Server Error" };
        else if (q.type === "ORDERING") answer = ["Physical", "Data Link", "Network", "Transport", "Session", "Presentation", "Application"];
        else answer = { answerId: "b" };

        await prisma.examAnswer.create({
          data: {
            sessionId: session3.id,
            questionId: q.id,
            answer: answer as any,
            answeredAt: new Date(now.getTime() - 5400000 + i * 300000),
            timeSpent: 120 + i * 60,
          },
        });
      }

      console.log(`  ✅ Session: ${candidateUsers[2].name} → SUBMITTED`);
    }

    console.log(`  ✅ Exam sessions created`);

    // ============================================================
    // Phase 5: Grading Seed Data
    // ============================================================

    console.log("Creating grading data...");

    // Get the submitted sessions for grading
    const submittedSessions = await prisma.examSession.findMany({
      where: { status: "SUBMITTED" },
      include: {
        examSchedule: {
          include: {
            exam: {
              select: {
                id: true,
                tenantId: true,
                passingScore: true,
                totalPoints: true,
                sections: {
                  include: {
                    questions: {
                      include: {
                        question: {
                          select: { id: true, type: true, correctAnswer: true, points: true },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        answers: true,
      },
    });

    for (const sess of submittedSessions) {
      const exam = sess.examSchedule.exam;

      // Build question map
      const questionMap = new Map<string, { type: string; correctAnswer: any; points: number; overridePoints: number | null }>();
      for (const section of exam.sections) {
        for (const sq of section.questions) {
          questionMap.set(sq.question.id, {
            type: sq.question.type,
            correctAnswer: sq.question.correctAnswer,
            points: sq.question.points,
            overridePoints: sq.points,
          });
        }
      }

      // Auto-gradable types
      const autoGradableTypes = ["MULTIPLE_CHOICE", "TRUE_FALSE", "MATCHING", "ORDERING", "FILL_IN_BLANK"];

      // Create Grade
      const grade = await prisma.grade.create({
        data: {
          tenantId: exam.tenantId,
          sessionId: sess.id,
          totalScore: 0,
          maxScore: exam.totalPoints,
          percentage: 0,
          isPassed: false,
          status: "GRADING", // Some essay answers need manual grading
        },
      });

      let totalScore = 0;
      let maxScore = 0;
      let hasManual = false;

      for (const answer of sess.answers) {
        const q = questionMap.get(answer.questionId);
        if (!q) continue;

        const ansMaxScore = q.overridePoints ?? q.points;
        maxScore += ansMaxScore;

        const isAutoGradable = autoGradableTypes.includes(q.type);

        if (isAutoGradable) {
          // Simple auto-grade for seed
          let score = 0;
          let isCorrect = false;
          const candidateAnswer = answer.answer as any;
          const correct = q.correctAnswer as any;

          if (candidateAnswer && correct) {
            if (q.type === "MULTIPLE_CHOICE" || q.type === "TRUE_FALSE") {
              isCorrect = candidateAnswer?.answerId === correct?.answerId;
              score = isCorrect ? ansMaxScore : 0;
            }
          }

          totalScore += score;
          await prisma.gradeAnswer.create({
            data: {
              gradeId: grade.id,
              answerId: answer.id,
              score,
              maxScore: ansMaxScore,
              isAutoGraded: true,
              isCorrect,
            },
          });
        } else {
          // Manual grading needed (ESSAY, SHORT_ANSWER, IMAGE_BASED)
          hasManual = true;
          // Pre-grade one essay with sample feedback
          const isGraded = q.type === "ESSAY" && Math.random() > 0.5;
          const essayScore = isGraded ? Math.round(ansMaxScore * 0.7) : 0;
          if (isGraded) totalScore += essayScore;

          await prisma.gradeAnswer.create({
            data: {
              gradeId: grade.id,
              answerId: answer.id,
              score: essayScore,
              maxScore: ansMaxScore,
              isAutoGraded: false,
              isCorrect: null,
              feedback: isGraded ? "อธิบายได้ดีพอสมควร แต่ขาดตัวอย่างประกอบที่เป็นรูปธรรม" : null,
              gradedById: isGraded ? createdById : null,
            },
          });
        }
      }

      // Update grade totals
      const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
      await prisma.grade.update({
        where: { id: grade.id },
        data: {
          totalScore: Math.round(totalScore * 100) / 100,
          maxScore,
          percentage: Math.round(percentage * 100) / 100,
          isPassed: percentage >= (exam.passingScore ?? 0),
          status: hasManual ? "GRADING" : "COMPLETED",
          gradedAt: hasManual ? null : new Date(),
        },
      });

      console.log(`  ✅ Grade: session ${sess.id.slice(0, 8)}... → ${totalScore}/${maxScore} (${Math.round(percentage)}%)`);
    }

    // Create a sample rubric
    const rubric = await prisma.rubric.create({
      data: {
        tenantId: tenant.id,
        examId: exam4.id,
        title: "เกณฑ์ตรวจข้อสอบอัตนัย IT Fundamentals",
        description: "ใช้สำหรับตรวจข้อสอบ Essay ในชุดสอบ IT Fundamentals",
        criteria: {
          create: [
            { name: "ความถูกต้องของเนื้อหา", description: "อธิบายหลักการได้ถูกต้อง ครบถ้วน ตรงประเด็น", maxScore: 10, sortOrder: 0 },
            { name: "ตัวอย่างประกอบ", description: "ยกตัวอย่างการใช้งานจริงได้เหมาะสม ชัดเจน", maxScore: 10, sortOrder: 1 },
            { name: "การเรียบเรียงและภาษา", description: "เขียนเรียงลำดับดี อ่านเข้าใจง่าย ใช้ภาษาถูกต้อง", maxScore: 10, sortOrder: 2 },
          ],
        },
      },
    });
    console.log(`  ✅ Rubric: ${rubric.title}`);

    // Create sample appeals (only if there are published or grading grades)
    const gradingGrade = await prisma.grade.findFirst({
      where: { tenantId: tenant.id },
      include: {
        session: { include: { answers: true } },
        gradeAnswers: true,
      },
    });

    if (gradingGrade && candidateIds[0]) {
      // First, publish the grade so we can appeal
      await prisma.grade.update({
        where: { id: gradingGrade.id },
        data: { status: "PUBLISHED", publishedAt: new Date() },
      });

      // Create an appeal
      const firstGradeAnswer = gradingGrade.gradeAnswers[0];
      if (firstGradeAnswer) {
        const answer = gradingGrade.session.answers.find((a) => a.id === firstGradeAnswer.answerId);
        await prisma.appeal.create({
          data: {
            tenantId: tenant.id,
            sessionId: gradingGrade.sessionId,
            candidateId: candidateIds[0],
            questionId: answer?.questionId ?? null,
            originalScore: firstGradeAnswer.score,
            reason: "ได้อธิบายเนื้อหาครบถ้วนแล้ว แต่ถูกหักคะแนนในส่วนของตัวอย่างประกอบ ซึ่งได้ยกตัวอย่างไว้ในย่อหน้าสุดท้ายแล้ว อาจถูกมองข้ามไป",
          },
        });

        await prisma.appeal.create({
          data: {
            tenantId: tenant.id,
            sessionId: gradingGrade.sessionId,
            candidateId: candidateIds[0],
            questionId: gradingGrade.session.answers[1]?.questionId ?? null,
            originalScore: gradingGrade.gradeAnswers[1]?.score ?? 0,
            reason: "คำตอบของข้าพเจ้าได้อ้างอิงตามหลักการที่ถูกต้อง แต่ไม่ได้รับคะแนนในส่วนนี้ กรุณาตรวจสอบอีกครั้ง",
          },
        });

        // Create one resolved appeal
        await prisma.appeal.create({
          data: {
            tenantId: tenant.id,
            sessionId: gradingGrade.sessionId,
            candidateId: candidateIds[0],
            questionId: gradingGrade.session.answers[2]?.questionId ?? null,
            originalScore: gradingGrade.gradeAnswers[2]?.score ?? 0,
            newScore: (gradingGrade.gradeAnswers[2]?.score ?? 0) + 1,
            reason: "คำตอบเขียนถูกต้องแต่อาจมีปัญหาเรื่องการสะกดคำ ซึ่งไม่ควรถูกหักคะแนนมากเกินไป",
            status: "APPROVED",
            response: "พิจารณาแล้วเห็นว่าคำตอบถูกต้อง ปรับคะแนนให้",
            resolvedById: createdById,
            resolvedAt: new Date(),
          },
        });
      }
      console.log(`  ✅ 3 appeals created (2 pending, 1 approved)`);
    }

    console.log(`  ✅ Grading seed data complete`);
  }

  // ============================================================
  // Phase 7: Test Center + Building + Room Seed Data
  // ============================================================

  console.log("Creating test centers, buildings, and rooms...");

  {
    const centerManagerUser = await prisma.user.findUnique({ where: { email: "center@u-exam.com" } });
    const adminUserForCenter = await prisma.user.findUnique({ where: { email: "admin@u-exam.com" } });

    // Center 1: Bangkok Main Center
    const center1 = await prisma.testCenter.create({
      data: {
        tenantId: tenant.id,
        managerId: centerManagerUser?.id ?? null,
        name: "ศูนย์สอบกรุงเทพฯ (พญาไท)",
        code: "BKK-PT",
        address: "126 ถนนพญาไท แขวงทุ่งพญาไท",
        district: "ราชเทวี",
        province: "กรุงเทพมหานคร",
        postalCode: "10400",
        phone: "02-123-4567",
        email: "bangkok-pt@u-exam.com",
        latitude: 13.7563,
        longitude: 100.5018,
        facilities: ["WiFi", "Parking", "Elevator", "CCTV", "Air Conditioning", "Cafeteria"],
        operatingHours: "จันทร์-ศุกร์ 08:00-18:00, เสาร์ 09:00-16:00",
        rating: 4.5,
        status: "ACTIVE",
        description: "ศูนย์สอบหลักกรุงเทพฯ ใกล้ BTS พญาไท มีห้องสอบคอมพิวเตอร์ 8 ห้อง",
      },
    });

    // Center 2: Chiang Mai Center
    const center2 = await prisma.testCenter.create({
      data: {
        tenantId: tenant.id,
        managerId: adminUserForCenter?.id ?? null,
        name: "ศูนย์สอบเชียงใหม่ (มช.)",
        code: "CNX-CMU",
        address: "239 ถนนห้วยแก้ว ตำบลสุเทพ",
        district: "เมืองเชียงใหม่",
        province: "เชียงใหม่",
        postalCode: "50200",
        phone: "053-941-000",
        email: "chiangmai@u-exam.com",
        latitude: 18.7961,
        longitude: 98.9518,
        facilities: ["WiFi", "Parking", "CCTV", "Air Conditioning"],
        operatingHours: "จันทร์-ศุกร์ 08:30-17:30",
        rating: 4.2,
        status: "ACTIVE",
        description: "ศูนย์สอบภาคเหนือ ภายในมหาวิทยาลัยเชียงใหม่",
      },
    });

    // Center 3: Khon Kaen Center
    const center3 = await prisma.testCenter.create({
      data: {
        tenantId: tenant.id,
        name: "ศูนย์สอบขอนแก่น",
        code: "KKC-01",
        address: "123 ถนนมิตรภาพ ตำบลในเมือง",
        district: "เมืองขอนแก่น",
        province: "ขอนแก่น",
        postalCode: "40000",
        phone: "043-200-300",
        facilities: ["WiFi", "Parking", "CCTV"],
        operatingHours: "จันทร์-ศุกร์ 09:00-17:00",
        rating: 3.8,
        status: "ACTIVE",
        description: "ศูนย์สอบภาคอีสาน",
      },
    });

    // Center 4: Songkhla (Maintenance)
    const center4 = await prisma.testCenter.create({
      data: {
        tenantId: tenant.id,
        name: "ศูนย์สอบสงขลา (มอ.)",
        code: "SKA-PSU",
        address: "15 ถนนกาญจนวณิชย์ ตำบลคอหงส์",
        district: "หาดใหญ่",
        province: "สงขลา",
        postalCode: "90110",
        phone: "074-282-000",
        facilities: ["WiFi", "CCTV", "Air Conditioning"],
        operatingHours: "จันทร์-ศุกร์ 08:30-16:30",
        rating: 4.0,
        status: "MAINTENANCE",
        description: "ศูนย์สอบภาคใต้ กำลังปรับปรุงระบบคอมพิวเตอร์",
      },
    });

    // Center 5: Nonthaburi (Inactive)
    const center5 = await prisma.testCenter.create({
      data: {
        tenantId: tenant.id,
        name: "ศูนย์สอบนนทบุรี",
        code: "NBI-01",
        address: "88 ถนนติวานนท์ ตำบลตลาดขวัญ",
        district: "เมืองนนทบุรี",
        province: "นนทบุรี",
        postalCode: "11000",
        phone: "02-980-1234",
        facilities: ["WiFi", "Parking"],
        rating: 3.5,
        status: "INACTIVE",
        description: "ศูนย์สอบสำรอง ปิดให้บริการชั่วคราว",
      },
    });

    console.log(`  ✅ 5 test centers created`);

    // ─── Buildings ──────────────────────────────────────────
    const bldg1a = await prisma.building.create({
      data: {
        testCenterId: center1.id,
        name: "อาคาร A (Computer Lab)",
        code: "BKK-A",
        floors: 4,
        description: "อาคารห้องสอบคอมพิวเตอร์หลัก",
        status: "ACTIVE",
      },
    });

    const bldg1b = await prisma.building.create({
      data: {
        testCenterId: center1.id,
        name: "อาคาร B (Conference)",
        code: "BKK-B",
        floors: 2,
        description: "อาคารห้องประชุมและสอบกระดาษ",
        status: "ACTIVE",
      },
    });

    const bldg2a = await prisma.building.create({
      data: {
        testCenterId: center2.id,
        name: "อาคารเรียนรวม 1",
        code: "CNX-1",
        floors: 5,
        description: "อาคารเรียนรวมมหาวิทยาลัย",
        status: "ACTIVE",
      },
    });

    const bldg3a = await prisma.building.create({
      data: {
        testCenterId: center3.id,
        name: "อาคารสอบ KKC",
        code: "KKC-A",
        floors: 3,
        status: "ACTIVE",
      },
    });

    const bldg4a = await prisma.building.create({
      data: {
        testCenterId: center4.id,
        name: "อาคาร IT ม.อ.",
        code: "SKA-IT",
        floors: 3,
        status: "MAINTENANCE",
      },
    });

    console.log(`  ✅ 5 buildings created`);

    // ─── Rooms ─────────────────────────────────────────────
    const roomsData = [
      // Center 1, Building A
      { testCenterId: center1.id, buildingId: bldg1a.id, name: "Lab A-101", code: "A101", floor: 1, capacity: 40, status: "AVAILABLE", hasProjector: true, hasAC: true, hasWebcam: true },
      { testCenterId: center1.id, buildingId: bldg1a.id, name: "Lab A-102", code: "A102", floor: 1, capacity: 40, status: "AVAILABLE", hasProjector: true, hasAC: true, hasWebcam: true },
      { testCenterId: center1.id, buildingId: bldg1a.id, name: "Lab A-201", code: "A201", floor: 2, capacity: 30, status: "IN_USE", hasProjector: true, hasAC: true, hasWebcam: false },
      { testCenterId: center1.id, buildingId: bldg1a.id, name: "Lab A-301 VIP", code: "A301", floor: 3, capacity: 20, status: "AVAILABLE", hasProjector: true, hasAC: true, hasWebcam: true, description: "ห้องสอบ VIP พร้อมคอมพิวเตอร์สเปคสูง" },
      // Center 1, Building B
      { testCenterId: center1.id, buildingId: bldg1b.id, name: "Hall B-101", code: "B101", floor: 1, capacity: 80, status: "AVAILABLE", hasProjector: true, hasAC: true, hasWebcam: false, description: "ห้องสอบขนาดใหญ่ สำหรับสอบกระดาษ" },
      { testCenterId: center1.id, buildingId: bldg1b.id, name: "Room B-201", code: "B201", floor: 2, capacity: 25, status: "MAINTENANCE", hasProjector: false, hasAC: true, hasWebcam: false },
      // Center 2
      { testCenterId: center2.id, buildingId: bldg2a.id, name: "ห้อง 101", code: "CNX-101", floor: 1, capacity: 60, status: "AVAILABLE", hasProjector: true, hasAC: true, hasWebcam: true },
      { testCenterId: center2.id, buildingId: bldg2a.id, name: "ห้อง 201", code: "CNX-201", floor: 2, capacity: 45, status: "AVAILABLE", hasProjector: true, hasAC: true, hasWebcam: false },
      { testCenterId: center2.id, buildingId: bldg2a.id, name: "ห้อง 301", code: "CNX-301", floor: 3, capacity: 30, status: "IN_USE", hasProjector: true, hasAC: true, hasWebcam: true },
      // Center 3
      { testCenterId: center3.id, buildingId: bldg3a.id, name: "Lab KKC-101", code: "KKC-101", floor: 1, capacity: 35, status: "AVAILABLE", hasProjector: true, hasAC: true, hasWebcam: false },
      { testCenterId: center3.id, buildingId: bldg3a.id, name: "Lab KKC-201", code: "KKC-201", floor: 2, capacity: 35, status: "AVAILABLE", hasProjector: true, hasAC: true, hasWebcam: false },
      // Center 4
      { testCenterId: center4.id, buildingId: bldg4a.id, name: "IT Lab 1", code: "SKA-L1", floor: 1, capacity: 40, status: "MAINTENANCE", hasProjector: true, hasAC: true, hasWebcam: true },
      { testCenterId: center4.id, buildingId: bldg4a.id, name: "IT Lab 2", code: "SKA-L2", floor: 2, capacity: 40, status: "MAINTENANCE", hasProjector: true, hasAC: true, hasWebcam: true },
      // Center 5 (inactive center, but has room data)
      { testCenterId: center5.id, name: "ห้อง NBI-01", code: "NBI-01", floor: 1, capacity: 30, status: "INACTIVE", hasProjector: false, hasAC: true, hasWebcam: false },
    ];

    for (const room of roomsData) {
      await prisma.room.create({ data: room });
    }
    console.log(`  ✅ ${roomsData.length} rooms created`);

    // ============================================================
    // Phase 8: Seat Layout + Equipment Seed Data
    // ============================================================

    console.log("Creating seats and equipment...");

    // Get rooms for seat generation
    const allRooms = await prisma.room.findMany({
      where: { testCenter: { tenantId: tenant.id } },
      select: { id: true, name: true, capacity: true, testCenterId: true },
    });

    // Generate seat layouts for first 4 rooms (with different sizes)
    const seatLayouts = [
      { roomIndex: 0, rows: 5, cols: 8 },  // Lab A-101: 5×8 = 40 seats
      { roomIndex: 1, rows: 5, cols: 8 },  // Lab A-102: 5×8 = 40 seats
      { roomIndex: 2, rows: 5, cols: 6 },  // Lab A-201: 5×6 = 30 seats
      { roomIndex: 3, rows: 4, cols: 5 },  // Lab A-301 VIP: 4×5 = 20 seats
      { roomIndex: 6, rows: 6, cols: 10 }, // ห้อง 101 (CNX): 6×10 = 60 seats
      { roomIndex: 9, rows: 5, cols: 7 },  // Lab KKC-101: 5×7 = 35 seats
    ];

    const rowLabels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    let totalSeatsCreated = 0;

    for (const layout of seatLayouts) {
      const room = allRooms[layout.roomIndex];
      if (!room) continue;

      const seatsData = [];
      for (let r = 0; r < layout.rows; r++) {
        for (let c = 0; c < layout.cols; c++) {
          // Add some variety: disable a few seats, reserve a few
          let status = "AVAILABLE";
          if (r === 0 && c === 0) status = "DISABLED"; // First seat disabled (corner)
          else if (r === 1 && c === layout.cols - 1) status = "RESERVED";
          else if (r === 2 && c === 3 && layout.rows > 3) status = "OCCUPIED";

          let type = "REGULAR";
          if (r === layout.rows - 1 && c === 0) type = "WHEELCHAIR";
          if (r === 0 && c === layout.cols - 1) type = "SPECIAL";

          seatsData.push({
            roomId: room.id,
            seatNumber: `${rowLabels[r]}-${c + 1}`,
            row: r,
            column: c,
            status: status,
            type: type,
          });
        }
      }

      await prisma.seat.createMany({ data: seatsData });
      totalSeatsCreated += seatsData.length;
    }
    console.log(`  ✅ ${totalSeatsCreated} seats created across ${seatLayouts.length} rooms`);

    // ─── Equipment ───────────────────────────────────────────
    const equipmentData = [
      // Center 1 (Bangkok) equipment
      { testCenterId: center1.id, name: "Dell OptiPlex 7090 #1", type: "COMPUTER", serialNumber: "DL-7090-001", status: "WORKING", lastChecked: new Date("2026-02-15") },
      { testCenterId: center1.id, name: "Dell OptiPlex 7090 #2", type: "COMPUTER", serialNumber: "DL-7090-002", status: "WORKING", lastChecked: new Date("2026-02-15") },
      { testCenterId: center1.id, name: "Dell OptiPlex 7090 #3", type: "COMPUTER", serialNumber: "DL-7090-003", status: "MAINTENANCE", lastChecked: new Date("2026-01-20"), description: "หน้าจอกะพริบ รอเปลี่ยนจอ" },
      { testCenterId: center1.id, name: "Epson EB-X51 Projector", type: "PROJECTOR", serialNumber: "EP-X51-001", status: "WORKING", lastChecked: new Date("2026-02-01") },
      { testCenterId: center1.id, name: "Logitech C920 HD Pro", type: "WEBCAM", serialNumber: "LG-C920-001", status: "WORKING", lastChecked: new Date("2026-03-01") },
      { testCenterId: center1.id, name: "Logitech C920 HD Pro #2", type: "WEBCAM", serialNumber: "LG-C920-002", status: "BROKEN", lastChecked: new Date("2026-01-10"), description: "เลนส์เสีย ส่งซ่อมไม่คุ้ม" },
      { testCenterId: center1.id, name: "HP LaserJet Pro M404n", type: "PRINTER", serialNumber: "HP-M404-001", status: "WORKING", lastChecked: new Date("2026-02-20") },
      { testCenterId: center1.id, name: "Cisco Catalyst 2960", type: "NETWORK", serialNumber: "CS-2960-001", status: "WORKING", lastChecked: new Date("2026-01-15") },
      { testCenterId: center1.id, name: "APC Smart-UPS 1500VA", type: "UPS", serialNumber: "APC-1500-001", status: "WORKING", lastChecked: new Date("2026-03-01") },
      { testCenterId: center1.id, name: "APC Smart-UPS 1500VA #2", type: "UPS", serialNumber: "APC-1500-002", status: "MAINTENANCE", lastChecked: new Date("2026-02-10"), description: "แบตเตอรี่เสื่อม รอเปลี่ยน" },
      { testCenterId: center1.id, name: "Dell P2422H Monitor", type: "MONITOR", serialNumber: "DL-P2422-001", status: "WORKING", lastChecked: new Date("2026-02-15") },
      { testCenterId: center1.id, name: "Dell P2422H Monitor #2", type: "MONITOR", serialNumber: "DL-P2422-002", status: "WORKING", lastChecked: new Date("2026-02-15") },
      // Center 2 (Chiang Mai) equipment
      { testCenterId: center2.id, name: "Lenovo ThinkCentre M90q", type: "COMPUTER", serialNumber: "LN-M90Q-001", status: "WORKING", lastChecked: new Date("2026-02-20") },
      { testCenterId: center2.id, name: "Lenovo ThinkCentre M90q #2", type: "COMPUTER", serialNumber: "LN-M90Q-002", status: "WORKING", lastChecked: new Date("2026-02-20") },
      { testCenterId: center2.id, name: "BenQ MH560 Projector", type: "PROJECTOR", serialNumber: "BQ-MH560-001", status: "WORKING", lastChecked: new Date("2026-01-30") },
      { testCenterId: center2.id, name: "TP-Link TL-SG1024", type: "NETWORK", serialNumber: "TP-SG1024-001", status: "WORKING", lastChecked: new Date("2026-02-01") },
      { testCenterId: center2.id, name: "Canon PIXMA G3020", type: "PRINTER", serialNumber: "CN-G3020-001", status: "MAINTENANCE", lastChecked: new Date("2026-01-05"), description: "หัวพิมพ์อุดตัน" },
      // Center 3 (Khon Kaen)
      { testCenterId: center3.id, name: "HP ProDesk 400 G7", type: "COMPUTER", serialNumber: "HP-400G7-001", status: "WORKING", lastChecked: new Date("2026-02-10") },
      { testCenterId: center3.id, name: "Epson EB-W52 Projector", type: "PROJECTOR", serialNumber: "EP-W52-001", status: "WORKING", lastChecked: new Date("2026-02-25") },
      { testCenterId: center3.id, name: "APC Back-UPS 800VA", type: "UPS", serialNumber: "APC-800-001", status: "BROKEN", lastChecked: new Date("2025-12-20"), description: "เสียถาวร รอจำหน่าย" },
      // Center 4 (Songkhla — maintenance)
      { testCenterId: center4.id, name: "Dell Vostro 3710", type: "COMPUTER", serialNumber: "DL-3710-001", status: "MAINTENANCE", lastChecked: new Date("2026-01-15") },
      { testCenterId: center4.id, name: "Logitech C922 Pro Stream", type: "WEBCAM", serialNumber: "LG-C922-001", status: "WORKING", lastChecked: new Date("2026-01-15") },
    ];

    for (const eq of equipmentData) {
      await prisma.equipment.create({ data: eq });
    }
    console.log(`  ✅ ${equipmentData.length} equipment items created`);

    // ============================================================
    // Phase 9: Staff Management Seed Data
    // ============================================================

    console.log("Creating center staff and shifts...");

    // Get users to assign as staff
    const proctorUser = await prisma.user.findUnique({ where: { email: "proctor@u-exam.com" } });
    const creatorUser = await prisma.user.findUnique({ where: { email: "creator@u-exam.com" } });
    const graderUser = await prisma.user.findUnique({ where: { email: "grader@u-exam.com" } });

    const staffEntries = [];

    // Staff for Center 1 (Bangkok)
    if (centerManagerUser) {
      staffEntries.push({
        testCenterId: center1.id,
        userId: centerManagerUser.id,
        position: "ADMIN",
        status: "ACTIVE",
        phone: "081-234-5678",
        certifications: ["การบริหารศูนย์สอบ", "ระบบสารสนเทศ"],
      });
    }
    if (proctorUser) {
      staffEntries.push({
        testCenterId: center1.id,
        userId: proctorUser.id,
        position: "PROCTOR",
        status: "ACTIVE",
        phone: "082-345-6789",
        certifications: ["ผู้คุมสอบระดับ 1"],
      });
    }
    if (creatorUser) {
      staffEntries.push({
        testCenterId: center1.id,
        userId: creatorUser.id,
        position: "IT_SUPPORT",
        status: "ACTIVE",
        phone: "083-456-7890",
      });
    }

    // Staff for Center 2 (Chiang Mai)
    if (graderUser) {
      staffEntries.push({
        testCenterId: center2.id,
        userId: graderUser.id,
        position: "PROCTOR",
        status: "ACTIVE",
        phone: "084-567-8901",
        certifications: ["ผู้คุมสอบระดับ 1", "ผู้ตรวจข้อสอบ"],
      });
    }
    if (proctorUser) {
      staffEntries.push({
        testCenterId: center2.id,
        userId: proctorUser.id,
        position: "COORDINATOR",
        status: "ON_LEAVE",
        phone: "082-345-6789",
        notes: "ลาพักร้อน 15-20 มี.ค.",
      });
    }

    // Staff for Center 3 (Khon Kaen)
    if (centerManagerUser) {
      staffEntries.push({
        testCenterId: center3.id,
        userId: centerManagerUser.id,
        position: "COORDINATOR",
        status: "ACTIVE",
        phone: "081-234-5678",
      });
    }
    if (creatorUser) {
      staffEntries.push({
        testCenterId: center3.id,
        userId: creatorUser.id,
        position: "RECEPTION",
        status: "INACTIVE",
        notes: "ลาออก",
      });
    }

    // Staff for Center 4 (Songkhla)
    if (graderUser) {
      staffEntries.push({
        testCenterId: center4.id,
        userId: graderUser.id,
        position: "IT_SUPPORT",
        status: "ACTIVE",
        phone: "084-567-8901",
      });
    }

    const createdStaff = [];
    for (const entry of staffEntries) {
      const cs = await prisma.centerStaff.create({ data: entry });
      createdStaff.push(cs);
    }
    console.log(`  ✅ ${createdStaff.length} center staff created`);

    // Create shifts for active staff
    const now = new Date();
    const shiftData = [];

    for (const cs of createdStaff) {
      if (cs.status !== "ACTIVE") continue;

      // Create upcoming shift (next week)
      const nextWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7);
      shiftData.push({
        centerStaffId: cs.id,
        userId: cs.userId,
        date: nextWeek,
        startTime: "09:00",
        endTime: "17:00",
        role: cs.position === "IT_SUPPORT" ? "SUPPORT" : cs.position === "ADMIN" ? "ADMIN" : "PROCTOR",
        status: "SCHEDULED",
      });

      // Another shift in 2 weeks
      const twoWeeks = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 14);
      shiftData.push({
        centerStaffId: cs.id,
        userId: cs.userId,
        date: twoWeeks,
        startTime: "08:30",
        endTime: "16:30",
        role: cs.position === "IT_SUPPORT" ? "SUPPORT" : cs.position === "ADMIN" ? "ADMIN" : "PROCTOR",
        status: "SCHEDULED",
      });
    }

    for (const shift of shiftData) {
      await prisma.staffShift.create({ data: shift });
    }
    console.log(`  ✅ ${shiftData.length} staff shifts created`);

    // ============================================================
    // Phase 10: Registration Seed Data
    // ============================================================

    console.log("Creating registrations...");

    // Fetch candidate users (created in Phase 4 seed)
    const regCandidates = await prisma.user.findMany({
      where: { email: { in: ["candidate1@u-exam.com", "candidate2@u-exam.com", "candidate3@u-exam.com"] } },
      orderBy: { email: "asc" },
    });
    const regCandidateIds = regCandidates.map((c) => c.id);

    // Fetch all scheduled exam schedules for registrations
    const allSchedules = await prisma.examSchedule.findMany({
      where: { tenantId: tenant.id },
      include: { exam: true },
      orderBy: { startDate: "asc" },
    });

    const scheduledSchedules = allSchedules.filter(
      (s) => s.status === "SCHEDULED" || s.status === "ACTIVE"
    );
    const completedSchedules = allSchedules.filter(
      (s) => s.status === "COMPLETED"
    );

    const registrationData: Array<{
      tenantId: string;
      candidateId: string;
      examScheduleId: string;
      testCenterId?: string;
      status: string;
      paymentStatus: string;
      amount: number;
      seatNumber?: string;
      waitingListOrder?: number;
      notes?: string;
      confirmedAt?: Date;
      cancelledAt?: Date;
    }> = [];

    // Candidate 1 (วิชัย) — CONFIRMED for scheduled exam 1, WAITING_LIST for exam 3
    if (regCandidateIds[0] && scheduledSchedules[0]) {
      registrationData.push({
        tenantId: tenant.id,
        candidateId: regCandidateIds[0],
        examScheduleId: scheduledSchedules[0].id,
        testCenterId: center1.id,
        status: "CONFIRMED",
        paymentStatus: "PAID",
        amount: 2500,
        seatNumber: "A-3",
        confirmedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 5),
      });
    }
    if (regCandidateIds[0] && scheduledSchedules.length > 2) {
      registrationData.push({
        tenantId: tenant.id,
        candidateId: regCandidateIds[0],
        examScheduleId: scheduledSchedules[2].id,
        status: "WAITING_LIST",
        paymentStatus: "PENDING",
        amount: 1500,
        waitingListOrder: 1,
      });
    }

    // Candidate 2 (สุนิสา) — CONFIRMED for exam 1, PENDING for exam 3
    if (regCandidateIds[1] && scheduledSchedules[0]) {
      registrationData.push({
        tenantId: tenant.id,
        candidateId: regCandidateIds[1],
        examScheduleId: scheduledSchedules[0].id,
        testCenterId: center1.id,
        status: "CONFIRMED",
        paymentStatus: "PAID",
        amount: 2500,
        seatNumber: "A-5",
        confirmedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3),
      });
    }
    if (regCandidateIds[1] && scheduledSchedules.length > 2) {
      registrationData.push({
        tenantId: tenant.id,
        candidateId: regCandidateIds[1],
        examScheduleId: scheduledSchedules[2].id,
        testCenterId: center2.id,
        status: "PENDING",
        paymentStatus: "PENDING",
        amount: 1500,
      });
    }

    // Candidate 3 (ปรีชา) — PENDING for exam 1, CANCELLED for exam 2 schedule
    if (regCandidateIds[2] && scheduledSchedules[0]) {
      registrationData.push({
        tenantId: tenant.id,
        candidateId: regCandidateIds[2],
        examScheduleId: scheduledSchedules[0].id,
        status: "PENDING",
        paymentStatus: "PENDING",
        amount: 2500,
        notes: "รอชำระเงิน",
      });
    }
    if (regCandidateIds[2] && scheduledSchedules.length > 1) {
      registrationData.push({
        tenantId: tenant.id,
        candidateId: regCandidateIds[2],
        examScheduleId: scheduledSchedules[1].id,
        status: "CANCELLED",
        paymentStatus: "REFUNDED",
        amount: 2500,
        cancelledAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1),
        notes: "ขอยกเลิกเนื่องจากติดธุระ",
      });
    }

    // Completed exam registrations (all 3 candidates for the completed schedule)
    if (completedSchedules[0]) {
      for (let i = 0; i < regCandidateIds.length; i++) {
        registrationData.push({
          tenantId: tenant.id,
          candidateId: regCandidateIds[i],
          examScheduleId: completedSchedules[0].id,
          testCenterId: center1.id,
          status: "CONFIRMED",
          paymentStatus: "PAID",
          amount: 1800,
          seatNumber: `B-${i + 1}`,
          confirmedAt: new Date(now.getFullYear(), now.getMonth() - 2, 1),
        });
      }
    }

    // Active schedule registrations (from exam session seed — all 3 are already taking the exam)
    const activeSchedules = allSchedules.filter((s) => s.status === "ACTIVE");
    if (activeSchedules[0]) {
      for (let i = 0; i < regCandidateIds.length; i++) {
        registrationData.push({
          tenantId: tenant.id,
          candidateId: regCandidateIds[i],
          examScheduleId: activeSchedules[0].id,
          status: "CONFIRMED",
          paymentStatus: "WAIVED",
          amount: 0,
          seatNumber: `C-${i + 1}`,
          confirmedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7),
          notes: "ค่าสมัครฟรี (โปรโมชั่น)",
        });
      }
    }

    // Additional WAITING_LIST entries for realism
    if (regCandidateIds[2] && scheduledSchedules.length > 2) {
      registrationData.push({
        tenantId: tenant.id,
        candidateId: regCandidateIds[2],
        examScheduleId: scheduledSchedules[2].id,
        status: "WAITING_LIST",
        paymentStatus: "PENDING",
        amount: 1500,
        waitingListOrder: 2,
      });
    }

    const createdRegs = [];
    for (const reg of registrationData) {
      const created = await prisma.registration.create({ data: reg });
      createdRegs.push(created);
    }
    console.log(`  ✅ ${registrationData.length} registrations created`);

    // ============================================================
    // Phase 12: Voucher Seed Data
    // ============================================================

    console.log("Creating vouchers...");

    // Generate vouchers for CONFIRMED registrations
    const confirmedRegs = createdRegs.filter((r) => r.status === "CONFIRMED");
    let voucherCount = 0;
    let voucherNum = 1;

    for (const reg of confirmedRegs) {
      const code = `VCH-2026-${String(voucherNum).padStart(4, "0")}`;
      const qrData = JSON.stringify({
        code,
        registrationId: reg.id,
        candidateId: reg.candidateId,
      });

      // Some vouchers are USED (for completed exam), some VALID
      const isCompletedExam = completedSchedules[0] && reg.examScheduleId === completedSchedules[0].id;
      const isActiveExam = activeSchedules[0] && reg.examScheduleId === activeSchedules[0].id;

      await prisma.voucher.create({
        data: {
          tenantId: tenant.id,
          registrationId: reg.id,
          candidateId: reg.candidateId,
          code,
          qrData,
          status: isCompletedExam ? "USED" : isActiveExam ? "USED" : "VALID",
          isUsed: isCompletedExam || isActiveExam,
          usedAt: isCompletedExam || isActiveExam ? new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1) : null,
        },
      });
      voucherNum++;
      voucherCount++;
    }
    console.log(`  ✅ ${voucherCount} vouchers created`);

    // ============================================================
    // Phase 13: Payment, Invoice & Coupon Seed Data
    // ============================================================

    console.log("Creating payments, invoices & coupons...");

    // Create payments for CONFIRMED registrations with PAID status
    const paidRegs = createdRegs.filter(
      (r) => r.status === "CONFIRMED" && r.paymentStatus === "PAID"
    );

    const paymentMethods = ["CREDIT_CARD", "PROMPTPAY", "BANK_TRANSFER", "E_WALLET"];
    let paymentCount = 0;
    let invoiceNum = 1;

    for (let i = 0; i < paidRegs.length; i++) {
      const reg = paidRegs[i];
      const method = paymentMethods[i % paymentMethods.length];
      const paidDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - (paidRegs.length - i)
      );

      const payment = await prisma.payment.create({
        data: {
          tenantId: tenant.id,
          registrationId: reg.id,
          candidateId: reg.candidateId,
          amount: reg.amount,
          method,
          status: "COMPLETED",
          transactionId: `TXN-${Date.now()}-${String(i + 1).padStart(3, "0")}`,
          description: `ค่าสมัครสอบ — การสมัคร #${i + 1}`,
          paidAt: paidDate,
        },
      });

      // Auto-create invoice for each completed payment
      const invoiceNumber = `INV-${now.getFullYear()}-${String(invoiceNum).padStart(4, "0")}`;
      await prisma.invoice.create({
        data: {
          tenantId: tenant.id,
          paymentId: payment.id,
          invoiceNumber,
          items: [
            {
              description: `ค่าสมัครสอบ — การสมัคร #${i + 1}`,
              quantity: 1,
              unitPrice: reg.amount,
              amount: reg.amount,
            },
          ],
          subtotal: reg.amount,
          taxRate: 0,
          taxAmount: 0,
          total: reg.amount,
          issuedAt: paidDate,
        },
      });
      invoiceNum++;
      paymentCount++;
    }

    // Create a PENDING payment for a pending registration
    const pendingRegs = createdRegs.filter(
      (r) => r.status === "PENDING" && r.paymentStatus === "PENDING"
    );
    for (const reg of pendingRegs.slice(0, 2)) {
      await prisma.payment.create({
        data: {
          tenantId: tenant.id,
          registrationId: reg.id,
          candidateId: reg.candidateId,
          amount: reg.amount,
          method: "PROMPTPAY",
          status: "PENDING",
          description: `ค่าสมัครสอบ — รอชำระเงิน`,
        },
      });
      paymentCount++;
    }

    // Create a REFUNDED payment for the cancelled registration
    const cancelledRegs = createdRegs.filter(
      (r) => r.status === "CANCELLED" && r.paymentStatus === "REFUNDED"
    );
    for (const reg of cancelledRegs) {
      const refundedPayment = await prisma.payment.create({
        data: {
          tenantId: tenant.id,
          registrationId: reg.id,
          candidateId: reg.candidateId,
          amount: reg.amount,
          method: "BANK_TRANSFER",
          status: "REFUNDED",
          transactionId: `TXN-REFUND-${Date.now()}`,
          description: `ค่าสมัครสอบ — ถูกยกเลิก`,
          paidAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 10),
        },
      });

      // Create refund record
      const adminUser = await prisma.user.findUnique({ where: { email: "admin@u-exam.com" } });
      await prisma.refund.create({
        data: {
          tenantId: tenant.id,
          paymentId: refundedPayment.id,
          amount: reg.amount,
          reason: "ผู้สมัครขอยกเลิก — คืนเงินเต็มจำนวน",
          status: "PROCESSED",
          processedById: adminUser?.id,
          processedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 8),
        },
      });
      paymentCount++;
    }

    console.log(`  ✅ ${paymentCount} payments created (with invoices & refunds)`);

    // Create Coupons
    const couponData = [
      {
        tenantId: tenant.id,
        code: "WELCOME2026",
        description: "ส่วนลดสำหรับผู้สมัครใหม่",
        type: "PERCENTAGE",
        value: 20,
        maxUses: 100,
        usedCount: 12,
        validFrom: new Date(now.getFullYear(), 0, 1),  // Jan 1
        validTo: new Date(now.getFullYear(), 11, 31),    // Dec 31
        isActive: true,
      },
      {
        tenantId: tenant.id,
        code: "EARLYBIRD",
        description: "Early bird discount สำหรับสมัครล่วงหน้า",
        type: "PERCENTAGE",
        value: 15,
        maxUses: 50,
        usedCount: 30,
        validFrom: new Date(now.getFullYear(), 0, 1),
        validTo: new Date(now.getFullYear(), 1, 28),    // Feb 28 — expired
        isActive: true,
      },
      {
        tenantId: tenant.id,
        code: "IT500OFF",
        description: "ลด 500 บาท สำหรับสอบ IT Fundamentals",
        type: "FIXED",
        value: 500,
        maxUses: 30,
        usedCount: 5,
        validFrom: new Date(now.getFullYear(), 0, 1),
        validTo: new Date(now.getFullYear(), 3, 30),   // Apr 30
        isActive: true,
      },
      {
        tenantId: tenant.id,
        code: "GROUPEXAM",
        description: "ส่วนลดสำหรับสมัครเป็นกลุ่ม (5 คนขึ้นไป)",
        type: "PERCENTAGE",
        value: 25,
        maxUses: 20,
        usedCount: 3,
        minAmount: 2000,
        maxDiscount: 1000,
        validFrom: new Date(now.getFullYear(), 0, 1),
        validTo: new Date(now.getFullYear(), 4, 15),   // May 15
        isActive: true,
      },
      {
        tenantId: tenant.id,
        code: "RETAKE1000",
        description: "ลด 1,000 บาทสำหรับสอบซ้ำ",
        type: "FIXED",
        value: 1000,
        maxUses: 10,
        usedCount: 2,
        minAmount: 1500,
        validFrom: new Date(now.getFullYear(), 0, 1),
        validTo: new Date(now.getFullYear(), 2, 1),    // Mar 1 — expired
        isActive: false,
      },
    ];

    for (const c of couponData) {
      await prisma.coupon.create({ data: c });
    }
    console.log(`  ✅ ${couponData.length} coupons created`);

    // ============================================================
    // Phase 14: Exam Day Log Seed Data (Check-in + Incidents)
    // ============================================================

    console.log("Creating exam day logs (check-in + incidents)...");

    // Use the active schedule (today's exam)
    const adminUser = await prisma.user.findUnique({ where: { email: "admin@u-exam.com" } });
    const todayActiveSchedule = activeSchedules[0];

    // Fetch candidate users for log metadata
    const seedCandidates = await prisma.user.findMany({
      where: { email: { in: ["candidate1@u-exam.com", "candidate2@u-exam.com", "candidate3@u-exam.com"] } },
      orderBy: { email: "asc" },
    });

    // Create some check-in events for today's active schedule
    const checkInLogs = todayActiveSchedule ? [
      {
        tenantId: tenant.id,
        examScheduleId: todayActiveSchedule.id,
        testCenterId: center1.id,
        createdById: adminUser?.id,
        type: "CHECKIN",
        description: "วิชัย ผู้สมัครสอบ เช็คอิน — ที่นั่ง A-3",
        metadata: {
          candidateId: seedCandidates[0]?.id,
          candidateName: seedCandidates[0]?.name ?? "วิชัย ผู้สมัครสอบ",
          voucherCode: "VCH-2026-0001",
          seatNumber: "A-3",
          isLate: false,
        },
        createdAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 30, 0),
      },
      {
        tenantId: tenant.id,
        examScheduleId: todayActiveSchedule.id,
        testCenterId: center1.id,
        createdById: adminUser?.id,
        type: "CHECKIN",
        description: "สุนิสา ผู้สมัครสอบ เช็คอิน — ที่นั่ง A-5",
        metadata: {
          candidateId: seedCandidates[1]?.id,
          candidateName: seedCandidates[1]?.name ?? "สุนิสา ผู้สมัครสอบ",
          voucherCode: "VCH-2026-0002",
          seatNumber: "A-5",
          isLate: false,
        },
        createdAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 45, 0),
      },
      {
        tenantId: tenant.id,
        examScheduleId: todayActiveSchedule.id,
        testCenterId: center1.id,
        createdById: adminUser?.id,
        type: "LATE_CHECKIN",
        description: "ปรีชา ผู้สมัครสอบ เช็คอิน (มาสาย) — ที่นั่ง B-1",
        metadata: {
          candidateId: seedCandidates[2]?.id,
          candidateName: seedCandidates[2]?.name ?? "ปรีชา ผู้สมัครสอบ",
          voucherCode: "VCH-2026-0003",
          seatNumber: "B-1",
          isLate: true,
        },
        createdAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 15, 0),
      },
    ] : [];

    for (const log of checkInLogs) {
      await prisma.examDayLog.create({ data: log });
    }

    // Create incident logs
    const incidentLogs = todayActiveSchedule ? [
      {
        tenantId: tenant.id,
        examScheduleId: todayActiveSchedule.id,
        testCenterId: center1.id,
        createdById: adminUser?.id,
        type: "INCIDENT",
        description: "คอมพิวเตอร์ที่นั่ง B-5 เปิดไม่ติด — ย้ายไปที่นั่งสำรอง B-41",
        severity: "MEDIUM",
        metadata: {
          seatNumber: "B-5",
          newSeat: "B-41",
          resolved: true,
        },
        createdAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 50, 0),
      },
      {
        tenantId: tenant.id,
        examScheduleId: todayActiveSchedule.id,
        testCenterId: center1.id,
        createdById: adminUser?.id,
        type: "INCIDENT",
        description: "ผู้สอบที่นั่ง A-8 ลืมบัตรประชาชน — ใช้ใบขับขี่แทน (อนุมัติแล้ว)",
        severity: "LOW",
        metadata: {
          seatNumber: "A-8",
          idType: "driving_license",
          approved: true,
        },
        createdAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 35, 0),
      },
    ] : [];

    for (const log of incidentLogs) {
      await prisma.examDayLog.create({ data: log });
    }

    console.log(`  ✅ ${checkInLogs.length} check-in logs + ${incidentLogs.length} incident logs created`);
  }

  console.log("\n🎉 Seed completed!");
}

seed()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
