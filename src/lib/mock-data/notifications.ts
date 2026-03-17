// Mock Notifications Data for U-Exam Platform

export type NotificationType =
  | "EXAM_REMINDER"
  | "RESULT_PUBLISHED"
  | "PAYMENT_CONFIRMED"
  | "REGISTRATION_APPROVED"
  | "REGISTRATION_WAITLIST"
  | "CERTIFICATE_ISSUED"
  | "EXAM_CANCELLED"
  | "SYSTEM_ANNOUNCEMENT";

export type MockNotification = {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  actionUrl: string | null;
  createdAt: string;
};

export const MOCK_NOTIFICATIONS: MockNotification[] = [
  {
    id: "notif_001",
    userId: "usr_011",
    type: "EXAM_REMINDER",
    title: "เตือนสอบ: IT Fundamentals",
    message:
      "การสอบ 'ใบรับรองวิชาชีพ IT Fundamentals' จะเริ่มในอีก 5 วัน (15 มี.ค. 2026 เวลา 09:00) ที่ศูนย์สอบสยามสแควร์ ห้อง A1 ที่นั่ง A1-12 กรุณาเตรียมบัตรประชาชนมาด้วย",
    isRead: false,
    actionUrl: "/profile/registrations",
    createdAt: "2026-03-10T08:00:00.000Z",
  },
  {
    id: "notif_002",
    userId: "usr_011",
    type: "RESULT_PUBLISHED",
    title: "ประกาศผลสอบ: Cybersecurity Essentials",
    message:
      "ผลสอบ 'ทดสอบความรู้ Cybersecurity Essentials' ได้ประกาศแล้ว คุณได้คะแนน 85% (ผ่าน) สามารถดูรายละเอียดคะแนนได้ที่หน้าผลสอบ",
    isRead: true,
    actionUrl: "/profile/results/exam_004",
    createdAt: "2025-12-16T10:00:00.000Z",
  },
  {
    id: "notif_003",
    userId: "usr_012",
    type: "PAYMENT_CONFIRMED",
    title: "ยืนยันการชำระเงิน",
    message:
      "การชำระเงินค่าสมัครสอบ 'Web Development Professional Certification' จำนวน 3,500 บาท ผ่าน PromptPay ได้รับการยืนยันแล้ว (INV-2026-0007)",
    isRead: true,
    actionUrl: "/profile/registrations",
    createdAt: "2026-02-22T13:36:00.000Z",
  },
  {
    id: "notif_004",
    userId: "usr_013",
    type: "REGISTRATION_WAITLIST",
    title: "อยู่ในรายการรอ: Web Dev Certification",
    message:
      "การลงทะเบียนสอบ 'Web Development Professional Certification' ที่ศูนย์สอบสยามสแควร์ ห้องสอบเต็ม คุณอยู่ในรายการรอลำดับที่ 3 ระบบจะแจ้งเตือนอัตโนมัติหากมีที่ว่าง",
    isRead: false,
    actionUrl: "/profile/registrations",
    createdAt: "2026-03-05T09:05:00.000Z",
  },
  {
    id: "notif_005",
    userId: "usr_011",
    type: "CERTIFICATE_ISSUED",
    title: "ออกใบรับรอง: Software Engineering",
    message:
      "ใบรับรอง 'Software Engineering Principles' (UEXAM-SE-2026-00092) ได้ออกเรียบร้อยแล้ว มีอายุถึง 21 ม.ค. 2028 สามารถดาวน์โหลด PDF หรือแชร์ลิงก์ยืนยันได้ที่หน้า Certificate",
    isRead: true,
    actionUrl: "/profile/certificates",
    createdAt: "2026-01-21T10:05:00.000Z",
  },
  {
    id: "notif_006",
    userId: "usr_014",
    type: "REGISTRATION_APPROVED",
    title: "อนุมัติการลงทะเบียน: Data Science",
    message:
      "การลงทะเบียนสอบ 'Data Science & Analytics Certification' ที่ศูนย์สอบขอนแก่น ได้รับการอนุมัติแล้ว กรุณาชำระเงินค่าสมัครสอบ 3,000 บาท ภายใน 7 วัน",
    isRead: true,
    actionUrl: "/profile/registrations",
    createdAt: "2026-03-08T17:05:00.000Z",
  },
  {
    id: "notif_007",
    userId: "usr_012",
    type: "EXAM_REMINDER",
    title: "เตือนสอบ: Web Dev Certification",
    message:
      "การสอบ 'Web Development Professional Certification' จะเริ่มในอีก 41 วัน (20 เม.ย. 2026 เวลา 09:00) ที่ศูนย์สอบบางนา ห้อง E2 ที่นั่ง E2-18",
    isRead: false,
    actionUrl: "/profile/registrations",
    createdAt: "2026-03-10T08:00:00.000Z",
  },
  {
    id: "notif_008",
    userId: "usr_015",
    type: "RESULT_PUBLISHED",
    title: "ประกาศผลสอบ: Software Engineering",
    message:
      "ผลสอบ 'Software Engineering Principles' ได้ประกาศแล้ว คุณได้คะแนน 60% (ผ่าน) สามารถดูรายละเอียดคะแนนรายหมวดได้ที่หน้าผลสอบ",
    isRead: false,
    actionUrl: "/profile/results/exam_005",
    createdAt: "2026-01-21T10:10:00.000Z",
  },
  {
    id: "notif_009",
    userId: "usr_013",
    type: "RESULT_PUBLISHED",
    title: "ประกาศผลสอบ: Q1 Assessment",
    message:
      "ผลสอบ 'TechCorp Internal - Q1 2026 Assessment' ได้ประกาศแล้ว คุณได้คะแนน 40% (ไม่ผ่าน) กรุณาติดต่อหัวหน้าทีมเพื่อวางแผนการพัฒนาทักษะ",
    isRead: false,
    actionUrl: "/profile/results/exam_006",
    createdAt: "2026-03-13T10:10:00.000Z",
  },
  {
    id: "notif_010",
    userId: "usr_011",
    type: "SYSTEM_ANNOUNCEMENT",
    title: "ประกาศ: ปรับปรุงระบบ U-Exam",
    message:
      "ระบบ U-Exam จะทำการปรับปรุงเวอร์ชันในวันเสาร์ที่ 22 มี.ค. 2026 เวลา 02:00-06:00 น. ในระหว่างนี้ระบบอาจไม่สามารถใช้งานได้ชั่วคราว ขออภัยในความไม่สะดวก",
    isRead: false,
    actionUrl: null,
    createdAt: "2026-03-10T12:00:00.000Z",
  },
];
