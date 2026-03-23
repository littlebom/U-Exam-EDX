import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

Font.register({
  family: "NotoSansThai",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/notosansthai/v29/iJWnBXeUZi_OHPqn4wq6hQ2_hbJ1xyN9wd43SofNWcd1MKVQt_So_9CdU5RtpzE.ttf",
      fontWeight: 400,
    },
    {
      src: "https://fonts.gstatic.com/s/notosansthai/v29/iJWnBXeUZi_OHPqn4wq6hQ2_hbJ1xyN9wd43SofNWcd1MKVQt_So_9CdU3NqpzE.ttf",
      fontWeight: 700,
    },
  ],
});

const PRIMARY = "#741717";

const styles = StyleSheet.create({
  page: { fontFamily: "NotoSansThai", fontSize: 10, padding: 40, color: "#1a1a1a" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  logo: { fontSize: 22, fontWeight: 700, color: PRIMARY },
  logoSub: { fontSize: 8, color: "#888", marginTop: 2 },
  title: { fontSize: 16, fontWeight: 700, textAlign: "right", color: PRIMARY },
  date: { fontSize: 9, textAlign: "right", color: "#888", marginTop: 4 },
  section: { fontSize: 11, fontWeight: 700, color: PRIMARY, marginBottom: 6, borderBottomWidth: 1, borderBottomColor: "#e5e5e5", paddingBottom: 4 },
  row: { flexDirection: "row", marginBottom: 3 },
  label: { width: 160, color: "#666" },
  value: { flex: 1, fontWeight: 700 },
  tableHeader: { flexDirection: "row", backgroundColor: "#f5f5f5", borderBottomWidth: 1, borderBottomColor: "#ccc", paddingVertical: 5, paddingHorizontal: 8 },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#eee", paddingVertical: 4, paddingHorizontal: 8 },
  col1: { flex: 2 },
  col2: { flex: 1, textAlign: "right" },
  col3: { flex: 1, textAlign: "right" },
  headerText: { fontWeight: 700, fontSize: 9, color: "#444" },
  footer: { position: "absolute", bottom: 30, left: 40, right: 40, textAlign: "center", fontSize: 7, color: "#bbb" },
});

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" });
}

export interface AnalyticsReportData {
  generatedAt: string;
  overview: {
    totalExams: number;
    totalCandidates: number;
    averagePassRate: number;
    averageScore: number;
    passCount: number;
    failCount: number;
    highestScore: number;
    lowestScore: number;
    medianScore: number;
    standardDeviation: number;
  };
  distribution: Array<{ range: string; count: number; percentage: number }>;
}

export function AnalyticsReportTemplate({ data }: { data: AnalyticsReportData }) {
  const o = data.overview;
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>U-Exam</Text>
            <Text style={styles.logoSub}>Enterprise-grade Examination Platform</Text>
          </View>
          <View>
            <Text style={styles.title}>Analytics Report</Text>
            <Text style={styles.date}>{formatDate(data.generatedAt)}</Text>
          </View>
        </View>

        <View style={{ marginBottom: 16 }}>
          <Text style={styles.section}>สรุปภาพรวม</Text>
          <View style={styles.row}><Text style={styles.label}>จำนวนสอบทั้งหมด</Text><Text style={styles.value}>{o.totalExams}</Text></View>
          <View style={styles.row}><Text style={styles.label}>จำนวนผู้เข้าสอบ</Text><Text style={styles.value}>{o.totalCandidates}</Text></View>
          <View style={styles.row}><Text style={styles.label}>อัตราผ่าน</Text><Text style={styles.value}>{o.averagePassRate.toFixed(1)}%</Text></View>
          <View style={styles.row}><Text style={styles.label}>คะแนนเฉลี่ย</Text><Text style={styles.value}>{o.averageScore.toFixed(1)}%</Text></View>
          <View style={styles.row}><Text style={styles.label}>ผ่าน / ไม่ผ่าน</Text><Text style={styles.value}>{o.passCount} / {o.failCount}</Text></View>
          <View style={styles.row}><Text style={styles.label}>คะแนนสูงสุด / ต่ำสุด</Text><Text style={styles.value}>{o.highestScore.toFixed(1)}% / {o.lowestScore.toFixed(1)}%</Text></View>
          <View style={styles.row}><Text style={styles.label}>ค่ามัธยฐาน</Text><Text style={styles.value}>{o.medianScore.toFixed(1)}%</Text></View>
          <View style={styles.row}><Text style={styles.label}>ส่วนเบี่ยงเบนมาตรฐาน</Text><Text style={styles.value}>{o.standardDeviation.toFixed(2)}</Text></View>
        </View>

        <View>
          <Text style={styles.section}>การกระจายคะแนน</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.col1, styles.headerText]}>ช่วงคะแนน</Text>
            <Text style={[styles.col2, styles.headerText]}>จำนวน</Text>
            <Text style={[styles.col3, styles.headerText]}>ร้อยละ</Text>
          </View>
          {data.distribution.map((d, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.col1}>{d.range}</Text>
              <Text style={styles.col2}>{d.count}</Text>
              <Text style={styles.col3}>{d.percentage.toFixed(1)}%</Text>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <Text>U-Exam Analytics Report — Generated on {formatDate(data.generatedAt)}</Text>
        </View>
      </Page>
    </Document>
  );
}
