import {
  LayoutDashboard,
  FileQuestion,
  ClipboardList,
  PenTool,
  Building2,
  UserPlus,
  CreditCard,
  Award,
  BarChart3,
  Bell,
  Eye,
  Users,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon?: LucideIcon;
  children?: NavItem[];
}

export const sidebarNav: NavItem[] = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "คลังข้อสอบ",
    href: "/admin/question-bank",
    icon: FileQuestion,
    children: [
      { title: "วิชาทั้งหมด", href: "/admin/question-bank" },
      { title: "ข้อสอบทั้งหมด", href: "/admin/question-bank/questions" },
      { title: "หมวดหมู่", href: "/admin/question-bank/categories" },
      { title: "Import / Export", href: "/admin/question-bank/import" },
    ],
  },
  {
    title: "จัดการสอบ",
    href: "/admin/exams",
    icon: ClipboardList,
    children: [
      { title: "ชุดข้อสอบ", href: "/admin/exams" },
      { title: "ตารางสอบ", href: "/admin/exams/schedule" },
      { title: "ติดตามผู้สอบ", href: "/admin/exams/sessions" },
    ],
  },
  {
    title: "ตรวจข้อสอบ",
    href: "/admin/grading",
    icon: PenTool,
    children: [
      { title: "รอตรวจ", href: "/admin/grading" },
      { title: "ผลคะแนน", href: "/admin/grading/results" },
      { title: "Rubric", href: "/admin/grading/rubrics" },
      { title: "ผู้ตรวจ", href: "/admin/grading/graders" },
      { title: "อุทธรณ์", href: "/admin/grading/appeals" },
    ],
  },
  {
    title: "ศูนย์สอบ",
    href: "/admin/test-centers",
    icon: Building2,
    children: [
      { title: "ศูนย์สอบทั้งหมด", href: "/admin/test-centers" },
      { title: "ห้องสอบ", href: "/admin/test-centers/rooms" },
      { title: "ผังที่นั่ง", href: "/admin/test-centers/seats" },
      { title: "อุปกรณ์", href: "/admin/test-centers/equipment" },
      { title: "บุคลากร", href: "/admin/test-centers/staff" },
      { title: "วันสอบ", href: "/admin/test-centers/exam-day" },
      { title: "สถิติ", href: "/admin/test-centers/analytics" },
      { title: "อนุมัติ", href: "/admin/test-centers/approvals" },
    ],
  },
  {
    title: "การสมัครสอบ",
    href: "/admin/registrations",
    icon: UserPlus,
    children: [
      { title: "รายการสมัคร", href: "/admin/registrations" },
      { title: "Waiting List", href: "/admin/registrations/waiting-list" },
      { title: "Voucher", href: "/admin/registrations/vouchers" },
    ],
  },
  {
    title: "การเงิน",
    href: "/admin/payments",
    icon: CreditCard,
    children: [
      { title: "รายการชำระ", href: "/admin/payments" },
      { title: "ใบเสร็จ", href: "/admin/payments/invoices" },
      { title: "คูปอง", href: "/admin/payments/coupons" },
    ],
  },
  {
    title: "Certificate",
    href: "/admin/certificates",
    icon: Award,
    children: [
      { title: "ใบรับรองทั้งหมด", href: "/admin/certificates" },
      { title: "เทมเพลต", href: "/admin/certificates/templates" },
    ],
  },
  {
    title: "รายงาน",
    href: "/admin/analytics",
    icon: BarChart3,
    children: [
      { title: "ภาพรวม", href: "/admin/analytics" },
      { title: "วิเคราะห์ข้อสอบ", href: "/admin/analytics/items" },
      { title: "แนวโน้ม", href: "/admin/analytics/trends" },
    ],
  },
  {
    title: "แจ้งเตือน",
    href: "/admin/notifications",
    icon: Bell,
  },
  {
    title: "คุมสอบ",
    href: "/admin/proctoring",
    icon: Eye,
    children: [
      { title: "Live Monitor", href: "/admin/proctoring" },
      { title: "เหตุการณ์", href: "/admin/proctoring/incidents" },
    ],
  },
  {
    title: "ผู้ใช้งาน",
    href: "/admin/users",
    icon: Users,
    children: [
      { title: "รายชื่อผู้ใช้", href: "/admin/users" },
      { title: "จัดการสิทธิ์", href: "/admin/users/roles" },
    ],
  },
  {
    title: "ตั้งค่า",
    href: "/admin/settings",
    icon: Settings,
    children: [
      { title: "องค์กร", href: "/admin/settings" },
      { title: "API Keys", href: "/admin/settings/api-keys" },
      { title: "Webhook", href: "/admin/settings/webhooks" },
      { title: "e-Wallet", href: "/admin/settings/ewallet" },
    ],
  },
];
