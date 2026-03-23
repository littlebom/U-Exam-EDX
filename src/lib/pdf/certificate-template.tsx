import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// Register Thai-compatible font (Noto Sans Thai TTF from Google Fonts)
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

// ─── Background colors ──────────────────────────────────────────────

const BACKGROUND_COLORS: Record<string, string> = {
  white: "#ffffff",
  cream: "#fdf8f0",
  "light-blue": "#f0f5fa",
  "light-gold": "#faf5eb",
};

// ─── Styles ─────────────────────────────────────────────────────────

function createStyles(primaryColor: string) {
  return StyleSheet.create({
    page: {
      fontFamily: "NotoSansThai",
      fontSize: 10,
      padding: 40,
      color: "#1a1a1a",
      position: "relative",
    },
    border: {
      position: "absolute",
      top: 20,
      left: 20,
      right: 20,
      bottom: 20,
      borderWidth: 3,
      borderColor: primaryColor,
      borderRadius: 4,
    },
    innerBorder: {
      position: "absolute",
      top: 26,
      left: 26,
      right: 26,
      bottom: 26,
      borderWidth: 1,
      borderColor: "#d4a574",
    },
    header: {
      alignItems: "center",
      marginBottom: 8,
      marginTop: 4,
    },
    logoImage: {
      width: 60,
      height: 60,
      objectFit: "contain" as const,
      marginBottom: 6,
    },
    logoText: {
      fontSize: 24,
      fontWeight: 700,
      color: primaryColor,
      letterSpacing: 2,
    },
    logoSub: {
      fontSize: 9,
      color: "#888",
      marginTop: 2,
      letterSpacing: 1,
    },
    divider: {
      width: 100,
      height: 2,
      backgroundColor: primaryColor,
      marginVertical: 6,
      alignSelf: "center" as const,
    },
    title: {
      fontSize: 20,
      fontWeight: 700,
      color: primaryColor,
      textAlign: "center" as const,
      marginBottom: 4,
      letterSpacing: 3,
    },
    subtitle: {
      fontSize: 11,
      color: "#666",
      textAlign: "center" as const,
      marginBottom: 20,
    },
    certifyText: {
      fontSize: 10,
      color: "#555",
      textAlign: "center" as const,
      marginBottom: 4,
    },
    candidateName: {
      fontSize: 22,
      fontWeight: 700,
      textAlign: "center" as const,
      color: "#1a1a1a",
      marginBottom: 6,
      paddingBottom: 4,
      borderBottomWidth: 1,
      borderBottomColor: "#d4a574",
      marginHorizontal: 60,
    },
    examTitle: {
      fontSize: 13,
      fontWeight: 700,
      textAlign: "center" as const,
      color: "#333",
      marginBottom: 4,
    },
    scoreText: {
      fontSize: 10,
      textAlign: "center" as const,
      color: "#555",
      marginBottom: 6,
    },
    bottomSection: {
      flexDirection: "row" as const,
      justifyContent: "space-between" as const,
      alignItems: "flex-end" as const,
      marginTop: "auto",
      paddingTop: 6,
    },
    infoCol: {
      flex: 1,
    },
    infoRow: {
      flexDirection: "row" as const,
      marginBottom: 3,
    },
    infoLabel: {
      width: 90,
      fontSize: 9,
      color: "#888",
    },
    infoValue: {
      fontSize: 9,
      color: "#333",
    },
    qrCol: {
      alignItems: "center" as const,
    },
    qrImage: {
      width: 60,
      height: 60,
    },
    qrCaption: {
      fontSize: 7,
      color: "#999",
      marginTop: 3,
      textAlign: "center" as const,
    },
    // Signatories
    signatoriesRow: {
      flexDirection: "row" as const,
      justifyContent: "center" as const,
      gap: 60,
      marginTop: 24,
      marginBottom: 4,
    },
    signatoryBlock: {
      alignItems: "center" as const,
      width: 180,
    },
    signatureImage: {
      width: 80,
      height: 30,
      objectFit: "contain" as const,
      marginBottom: 4,
    },
    signatoryLine: {
      width: 150,
      borderBottomWidth: 1,
      borderBottomColor: "#999",
      marginBottom: 6,
    },
    signatoryName: {
      fontSize: 10,
      fontWeight: 700,
      textAlign: "center" as const,
      color: "#333",
    },
    signatoryTitle: {
      fontSize: 8,
      textAlign: "center" as const,
      color: "#666",
      marginTop: 2,
    },
    footer: {
      position: "absolute" as const,
      bottom: 26,
      left: 40,
      right: 40,
      textAlign: "center" as const,
      fontSize: 7,
      color: "#bbb",
    },
  });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ─── Types ──────────────────────────────────────────────────────────

export interface Signatory {
  name: string;
  title: string;
  signatureUrl?: string | null;
}

export interface CertificatePdfData {
  certificateNumber: string;
  candidateName: string;
  examTitle: string;
  score: number;
  maxScore: number;
  percentage: number;
  issuedAt: string;
  expiresAt: string | null;
  templateName: string;
  qrCodeDataUrl: string;
  // Design fields
  logoUrl?: string | null;
  primaryColor?: string;
  background?: string;
  backgroundUrl?: string | null;
  signatories?: Signatory[];
}

// ─── Component ──────────────────────────────────────────────────────

export function CertificateTemplate({ data }: { data: CertificatePdfData }) {
  const color = data.primaryColor || "#741717";
  const bg = BACKGROUND_COLORS[data.background || "white"] || "#ffffff";
  const styles = createStyles(color);
  const signatories = data.signatories ?? [];

  return (
    <Document>
      <Page
        size="A4"
        orientation="landscape"
        style={{ ...styles.page, backgroundColor: data.backgroundUrl ? "#ffffff" : bg }}
      >
        {/* Background Image — full page, behind everything */}
        {data.backgroundUrl && (
          <Image
            src={data.backgroundUrl}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover" as const,
            }}
            fixed
          />
        )}

        {/* Decorative borders */}
        <View style={styles.border} fixed />
        <View style={styles.innerBorder} fixed />

        {/* Header — Logo or Text */}
        <View style={styles.header}>
          {data.logoUrl ? (
            <Image
              style={styles.logoImage}
              src={data.logoUrl}
            />
          ) : (
            <>
              <Text style={styles.logoText}>U-Exam</Text>
              <Text style={styles.logoSub}>
                Enterprise-grade Examination Platform
              </Text>
            </>
          )}
        </View>

        <View style={styles.divider} />

        {/* Title */}
        <Text style={styles.title}>CERTIFICATE OF ACHIEVEMENT</Text>

        {/* Body */}
        <Text style={[styles.certifyText, { marginTop: 36 }]}>
          This is to certify that / ขอรับรองว่า
        </Text>
        <Text style={styles.candidateName}>{data.candidateName}</Text>
        <Text style={styles.certifyText}>
          has successfully passed the examination / ได้ผ่านการสอบ
        </Text>
        <Text style={styles.examTitle}>{data.examTitle}</Text>
        <Text style={styles.scoreText}>
          Score: {data.score}/{data.maxScore} ({data.percentage.toFixed(1)}%)
        </Text>

        {/* Signatories */}
        {signatories.length > 0 && (
          <View style={styles.signatoriesRow}>
            {signatories.map((sig, idx) => (
              <View key={idx} style={styles.signatoryBlock}>
                {sig.signatureUrl && (
                  <Image style={styles.signatureImage} src={sig.signatureUrl} />
                )}
                <View style={styles.signatoryLine} />
                <Text style={styles.signatoryName}>{sig.name}</Text>
                <Text style={styles.signatoryTitle}>{sig.title}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Bottom Section */}
        <View style={styles.bottomSection}>
          <View style={styles.infoCol}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Certificate No.</Text>
              <Text style={styles.infoValue}>
                {data.certificateNumber}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Issued Date</Text>
              <Text style={styles.infoValue}>
                {formatDate(data.issuedAt)}
              </Text>
            </View>
            {data.expiresAt && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Expires Date</Text>
                <Text style={styles.infoValue}>
                  {formatDate(data.expiresAt)}
                </Text>
              </View>
            )}
          </View>

          {/* QR Code */}
          <View style={styles.qrCol}>
            <Image style={styles.qrImage} src={data.qrCodeDataUrl} />
            <Text style={styles.qrCaption}>Scan to verify</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            U-Exam | This certificate can be verified at the URL encoded in
            the QR code above.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
