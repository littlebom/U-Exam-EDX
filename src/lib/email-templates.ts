const PRIMARY = "#741717";
const BG = "#f9f9f9";

interface NotificationEmailData {
  title: string;
  message: string;
  link?: string | null;
  type: string;
}

// ─── Type-specific icons & colors ──────────────────────────────────

const TYPE_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  RESULT_PUBLISHED: { icon: "📊", color: "#2563eb", label: "ผลสอบ" },
  CERTIFICATE_ISSUED: { icon: "🎓", color: "#059669", label: "ใบรับรอง" },
  PAYMENT_COMPLETED: { icon: "💳", color: "#7c3aed", label: "การชำระเงิน" },
  REFUND_APPROVED: { icon: "💰", color: "#d97706", label: "คืนเงิน" },
  REFUND_PROCESSED: { icon: "💰", color: "#d97706", label: "คืนเงิน" },
  EXAM_SUBMITTED: { icon: "✅", color: "#059669", label: "ส่งข้อสอบ" },
  EXAM_REMINDER: { icon: "⏰", color: "#dc2626", label: "เตือนสอบ" },
  REGISTRATION_APPROVED: { icon: "📝", color: "#2563eb", label: "สมัครสอบ" },
  GRADING_REQUIRED: { icon: "✏️", color: "#d97706", label: "ตรวจข้อสอบ" },
  SYSTEM_ANNOUNCEMENT: { icon: "📢", color: PRIMARY, label: "ประกาศ" },
};

// ─── Type-specific action button text ─────────────────────────────

const ACTION_TEXT: Record<string, string> = {
  RESULT_PUBLISHED: "ดูผลสอบ",
  CERTIFICATE_ISSUED: "ดูใบรับรอง",
  PAYMENT_COMPLETED: "ดูรายละเอียด",
  EXAM_REMINDER: "ดูตารางสอบ",
  REGISTRATION_APPROVED: "ดูสถานะการสมัคร",
  GRADING_REQUIRED: "ไปตรวจข้อสอบ",
  SYSTEM_ANNOUNCEMENT: "อ่านเพิ่มเติม",
};

// ─── Main renderer ────────────────────────────────────────────────

export function renderNotificationEmail(data: NotificationEmailData): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const actionUrl = data.link ? `${appUrl}${data.link}` : null;
  const config = TYPE_CONFIG[data.type] ?? { icon: "🔔", color: PRIMARY, label: "แจ้งเตือน" };
  const actionText = ACTION_TEXT[data.type] ?? "ดูรายละเอียด";

  return `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.title}</title>
</head>
<body style="margin:0;padding:0;background-color:${BG};font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:${BG};padding:32px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
          <!-- Header -->
          <tr>
            <td style="background-color:${PRIMARY};padding:24px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:1px;">U-Exam</h1>
              <p style="margin:4px 0 0;color:rgba(255,255,255,0.7);font-size:11px;">Enterprise-grade Examination Platform</p>
            </td>
          </tr>
          <!-- Type Badge -->
          <tr>
            <td style="padding:24px 32px 0;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color:${config.color}12;border-radius:6px;padding:6px 14px;">
                    <span style="font-size:14px;">${config.icon}</span>
                    <span style="color:${config.color};font-size:12px;font-weight:600;margin-left:4px;">${config.label}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:16px 32px 32px;">
              <h2 style="margin:0 0 12px;color:#1a1a1a;font-size:18px;font-weight:600;">${data.title}</h2>
              <p style="margin:0 0 24px;color:#555;font-size:14px;line-height:1.6;">${data.message}</p>
              ${actionUrl ? `
              <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="background-color:${config.color};border-radius:8px;">
                    <a href="${actionUrl}" target="_blank" style="display:inline-block;padding:12px 28px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;">
                      ${actionText}
                    </a>
                  </td>
                </tr>
              </table>
              ` : ""}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px;border-top:1px solid #eee;text-align:center;">
              <p style="margin:0;color:#999;font-size:11px;">
                อีเมลนี้ส่งจากระบบ U-Exam โดยอัตโนมัติ กรุณาอย่าตอบกลับ
              </p>
              <p style="margin:4px 0 0;color:#bbb;font-size:10px;">
                &copy; ${new Date().getFullYear()} U-Exam. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
