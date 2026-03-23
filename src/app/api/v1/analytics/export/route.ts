import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { handleApiError } from "@/lib/errors";
import { getOverviewStats, getScoreDistribution } from "@/services/analytics.service";
import { exportFilterSchema } from "@/lib/validations/analytics";
import { renderToBuffer } from "@react-pdf/renderer";
import { AnalyticsReportTemplate, type AnalyticsReportData } from "@/lib/pdf/analytics-report-template";
import * as XLSX from "xlsx";
import { stringify } from "csv-stringify/sync";

export async function GET(request: NextRequest) {
  try {
    const session = await requirePermission("analytics:view");
    const params = Object.fromEntries(request.nextUrl.searchParams);
    const filters = exportFilterSchema.parse(params);
    const { format, examId, dateFrom, dateTo } = filters;

    // Fetch data
    const [overview, scoreDist] = await Promise.all([
      getOverviewStats(session.tenantId, { examId, dateFrom, dateTo }),
      getScoreDistribution(session.tenantId, { examId, dateFrom, dateTo, buckets: 10 }),
    ]);

    const timestamp = new Date().toISOString().slice(0, 10);

    if (format === "csv") {
      const rows = [
        ["สถิติ", "ค่า"],
        ["จำนวนสอบทั้งหมด", String(overview.totalExams)],
        ["จำนวนผู้เข้าสอบ", String(overview.totalCandidates)],
        ["อัตราผ่าน (%)", overview.averagePassRate.toFixed(1)],
        ["คะแนนเฉลี่ย (%)", overview.averageScore.toFixed(1)],
        ["ผ่าน", String(overview.passCount)],
        ["ไม่ผ่าน", String(overview.failCount)],
        ["คะแนนสูงสุด (%)", overview.highestScore.toFixed(1)],
        ["คะแนนต่ำสุด (%)", overview.lowestScore.toFixed(1)],
        ["ค่ามัธยฐาน (%)", overview.medianScore.toFixed(1)],
        ["ส่วนเบี่ยงเบนมาตรฐาน", overview.standardDeviation.toFixed(2)],
        [],
        ["ช่วงคะแนน", "จำนวน", "ร้อยละ"],
        ...scoreDist.distribution.map((d) => [
          d.range,
          String(d.count),
          d.percentage.toFixed(1),
        ]),
      ];

      const csv = stringify(rows);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="analytics-${timestamp}.csv"`,
        },
      });
    }

    if (format === "xlsx") {
      const summaryData = [
        ["สถิติ", "ค่า"],
        ["จำนวนสอบทั้งหมด", overview.totalExams],
        ["จำนวนผู้เข้าสอบ", overview.totalCandidates],
        ["อัตราผ่าน (%)", overview.averagePassRate],
        ["คะแนนเฉลี่ย (%)", overview.averageScore],
        ["ผ่าน", overview.passCount],
        ["ไม่ผ่าน", overview.failCount],
        ["คะแนนสูงสุด (%)", overview.highestScore],
        ["คะแนนต่ำสุด (%)", overview.lowestScore],
        ["ค่ามัธยฐาน (%)", overview.medianScore],
        ["ส่วนเบี่ยงเบนมาตรฐาน", overview.standardDeviation],
      ];

      const distData = [
        ["ช่วงคะแนน", "จำนวน", "ร้อยละ"],
        ...scoreDist.distribution.map((d) => [d.range, d.count, d.percentage]),
      ];

      const wb = XLSX.utils.book_new();
      const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
      const ws2 = XLSX.utils.aoa_to_sheet(distData);
      XLSX.utils.book_append_sheet(wb, ws1, "สรุปภาพรวม");
      XLSX.utils.book_append_sheet(wb, ws2, "การกระจายคะแนน");

      const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
      return new NextResponse(buffer, {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="analytics-${timestamp}.xlsx"`,
        },
      });
    }

    // PDF
    const reportData: AnalyticsReportData = {
      generatedAt: new Date().toISOString(),
      overview,
      distribution: scoreDist.distribution,
    };

    const buffer = await renderToBuffer(
      AnalyticsReportTemplate({ data: reportData })
    );

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="analytics-${timestamp}.pdf"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
