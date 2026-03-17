// Mock Users Data for U-Exam Platform
// Covers all 9 roles: PLATFORM_ADMIN, TENANT_OWNER, ADMIN, EXAM_CREATOR, GRADER, PROCTOR, CENTER_MANAGER, CENTER_STAFF, CANDIDATE

export type UserRole =
  | "PLATFORM_ADMIN"
  | "TENANT_OWNER"
  | "ADMIN"
  | "EXAM_CREATOR"
  | "GRADER"
  | "PROCTOR"
  | "CENTER_MANAGER"
  | "CENTER_STAFF"
  | "CANDIDATE";

export type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

export type MockUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  tenantId: string | null;
  status: UserStatus;
  avatar: string | null;
  phone: string;
  lastLogin: string;
  createdAt: string;
};

export const MOCK_USERS: MockUser[] = [
  {
    id: "usr_001",
    firstName: "สมชาย",
    lastName: "ศรีสุข",
    email: "somchai.s@uexam.io",
    role: "PLATFORM_ADMIN",
    tenantId: null,
    status: "ACTIVE",
    avatar: null,
    phone: "081-234-5678",
    lastLogin: "2026-03-10T08:30:00.000Z",
    createdAt: "2025-01-15T10:00:00.000Z",
  },
  {
    id: "usr_002",
    firstName: "วิภา",
    lastName: "จันทร์แก้ว",
    email: "wipa.c@techcorp.co.th",
    role: "TENANT_OWNER",
    tenantId: "tenant_001",
    status: "ACTIVE",
    avatar: null,
    phone: "089-876-5432",
    lastLogin: "2026-03-09T14:20:00.000Z",
    createdAt: "2025-02-01T09:00:00.000Z",
  },
  {
    id: "usr_003",
    firstName: "ประสิทธิ์",
    lastName: "มั่นคง",
    email: "prasit.m@techcorp.co.th",
    role: "ADMIN",
    tenantId: "tenant_001",
    status: "ACTIVE",
    avatar: null,
    phone: "086-111-2233",
    lastLogin: "2026-03-10T09:15:00.000Z",
    createdAt: "2025-02-10T08:00:00.000Z",
  },
  {
    id: "usr_004",
    firstName: "ดร.นภา",
    lastName: "วงศ์ประเสริฐ",
    email: "napa.w@techcorp.co.th",
    role: "EXAM_CREATOR",
    tenantId: "tenant_001",
    status: "ACTIVE",
    avatar: null,
    phone: "082-333-4455",
    lastLogin: "2026-03-09T16:45:00.000Z",
    createdAt: "2025-03-01T10:00:00.000Z",
  },
  {
    id: "usr_005",
    firstName: "อรุณ",
    lastName: "แสงทอง",
    email: "arun.s@techcorp.co.th",
    role: "EXAM_CREATOR",
    tenantId: "tenant_001",
    status: "ACTIVE",
    avatar: null,
    phone: "083-555-6677",
    lastLogin: "2026-03-08T11:30:00.000Z",
    createdAt: "2025-03-15T09:00:00.000Z",
  },
  {
    id: "usr_006",
    firstName: "สุนิสา",
    lastName: "พิมพ์ทอง",
    email: "sunisa.p@techcorp.co.th",
    role: "GRADER",
    tenantId: "tenant_001",
    status: "ACTIVE",
    avatar: null,
    phone: "084-777-8899",
    lastLogin: "2026-03-07T13:00:00.000Z",
    createdAt: "2025-04-01T08:30:00.000Z",
  },
  {
    id: "usr_007",
    firstName: "ธนกฤต",
    lastName: "รัตนะ",
    email: "thanakrit.r@techcorp.co.th",
    role: "GRADER",
    tenantId: "tenant_001",
    status: "INACTIVE",
    avatar: null,
    phone: "085-999-0011",
    lastLogin: "2025-12-20T10:00:00.000Z",
    createdAt: "2025-04-10T09:00:00.000Z",
  },
  {
    id: "usr_008",
    firstName: "พรรณี",
    lastName: "ใจดี",
    email: "pannee.j@techcorp.co.th",
    role: "PROCTOR",
    tenantId: "tenant_001",
    status: "ACTIVE",
    avatar: null,
    phone: "086-222-3344",
    lastLogin: "2026-03-10T07:00:00.000Z",
    createdAt: "2025-05-01T10:00:00.000Z",
  },
  {
    id: "usr_009",
    firstName: "กิตติ",
    lastName: "เจริญสุข",
    email: "kitti.c@examcenter.co.th",
    role: "CENTER_MANAGER",
    tenantId: "tenant_002",
    status: "ACTIVE",
    avatar: null,
    phone: "087-444-5566",
    lastLogin: "2026-03-09T08:45:00.000Z",
    createdAt: "2025-05-15T09:00:00.000Z",
  },
  {
    id: "usr_010",
    firstName: "รัชนี",
    lastName: "สมบูรณ์",
    email: "ratchanee.s@examcenter.co.th",
    role: "CENTER_STAFF",
    tenantId: "tenant_002",
    status: "ACTIVE",
    avatar: null,
    phone: "088-666-7788",
    lastLogin: "2026-03-10T06:30:00.000Z",
    createdAt: "2025-06-01T08:00:00.000Z",
  },
  {
    id: "usr_011",
    firstName: "ณัฐพล",
    lastName: "ศิริวัฒน์",
    email: "nattapol.s@gmail.com",
    role: "CANDIDATE",
    tenantId: null,
    status: "ACTIVE",
    avatar: null,
    phone: "091-123-4567",
    lastLogin: "2026-03-10T10:00:00.000Z",
    createdAt: "2025-07-01T14:00:00.000Z",
  },
  {
    id: "usr_012",
    firstName: "ปิยะธิดา",
    lastName: "แก้วมณี",
    email: "piyathida.k@gmail.com",
    role: "CANDIDATE",
    tenantId: null,
    status: "ACTIVE",
    avatar: null,
    phone: "092-234-5678",
    lastLogin: "2026-03-09T18:30:00.000Z",
    createdAt: "2025-07-15T10:00:00.000Z",
  },
  {
    id: "usr_013",
    firstName: "วรเมธ",
    lastName: "ทองคำ",
    email: "woramet.t@hotmail.com",
    role: "CANDIDATE",
    tenantId: null,
    status: "ACTIVE",
    avatar: null,
    phone: "093-345-6789",
    lastLogin: "2026-03-08T20:00:00.000Z",
    createdAt: "2025-08-01T09:00:00.000Z",
  },
  {
    id: "usr_014",
    firstName: "กัลยา",
    lastName: "พงษ์พิพัฒน์",
    email: "kanlaya.p@outlook.com",
    role: "CANDIDATE",
    tenantId: null,
    status: "SUSPENDED",
    avatar: null,
    phone: "094-456-7890",
    lastLogin: "2025-11-30T12:00:00.000Z",
    createdAt: "2025-08-20T11:00:00.000Z",
  },
  {
    id: "usr_015",
    firstName: "ชาญชัย",
    lastName: "บุญเรือง",
    email: "chanchai.b@gmail.com",
    role: "CANDIDATE",
    tenantId: null,
    status: "ACTIVE",
    avatar: null,
    phone: "095-567-8901",
    lastLogin: "2026-03-10T07:45:00.000Z",
    createdAt: "2025-09-01T13:00:00.000Z",
  },
];
