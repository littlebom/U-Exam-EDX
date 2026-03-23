import { renderToBuffer } from "@react-pdf/renderer";
import { getOverviewStats, getScoreDistribution } from "./analytics.service";
import {
  AnalyticsReportTemplate,
  type AnalyticsReportData,
} from "@/lib/pdf/analytics-report-template";

export async function generateAnalyticsReport(
  tenantId: string,
  filters: { examId?: string } = {}
): Promise<Buffer> {
  const [overview, scoreDist] = await Promise.all([
    getOverviewStats(tenantId, filters),
    getScoreDistribution(tenantId, { ...filters, buckets: 10 }),
  ]);

  const reportData: AnalyticsReportData = {
    generatedAt: new Date().toISOString(),
    overview,
    distribution: scoreDist.distribution,
  };

  const buffer = await renderToBuffer(
    AnalyticsReportTemplate({ data: reportData })
  );

  return Buffer.from(buffer);
}
