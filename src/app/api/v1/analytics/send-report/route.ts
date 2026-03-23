import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { handleApiError, errors } from "@/lib/errors";
import { generateAnalyticsReport } from "@/services/report.service";
import { sendEmail } from "@/lib/mailer";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  examId: z.string().uuid().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await requirePermission("analytics:view");
    const body = await request.json();
    const { email, examId } = schema.parse(body);

    if (!process.env.SMTP_USER) {
      throw errors.validation("ยังไม่ได้ตั้งค่า SMTP — กรุณาตั้งค่าก่อนส่งอีเมล");
    }

    const pdfBuffer = await generateAnalyticsReport(session.tenantId, {
      examId,
    });

    const timestamp = new Date().toISOString().slice(0, 10);

    await sendEmail({
      to: email,
      subject: `U-Exam Analytics Report — ${timestamp}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px;">
          <h2 style="color: #741717;">U-Exam Analytics Report</h2>
          <p>แนบรายงานสถิติผลสอบ สร้างเมื่อ ${timestamp}</p>
          <p style="color: #888; font-size: 12px;">
            รายงานนี้สร้างโดยระบบ U-Exam
          </p>
        </div>
      `,
      attachments: [
        {
          filename: `analytics-report-${timestamp}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    return NextResponse.json({
      success: true,
      data: { message: `ส่งรายงานไปที่ ${email} สำเร็จ` },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
