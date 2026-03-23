import {
  Document,
  Page,
  Text,
  View,
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

const styles = StyleSheet.create({
  page: {
    fontFamily: "NotoSansThai",
    fontSize: 10,
    padding: 40,
    color: "#1a1a1a",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  logo: {
    fontSize: 24,
    fontWeight: 700,
    color: "#741717",
  },
  logoSub: {
    fontSize: 8,
    color: "#666",
    marginTop: 2,
  },
  invoiceTitle: {
    fontSize: 18,
    fontWeight: 700,
    textAlign: "right",
    color: "#741717",
  },
  invoiceNumber: {
    fontSize: 10,
    textAlign: "right",
    color: "#666",
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: "#741717",
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
    paddingBottom: 4,
  },
  row: {
    flexDirection: "row",
    marginBottom: 3,
  },
  label: {
    width: 100,
    color: "#666",
  },
  value: {
    flex: 1,
  },
  // Table
  table: {
    marginTop: 20,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f5f5f5",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  colDescription: {
    flex: 3,
  },
  colQty: {
    flex: 1,
    textAlign: "center",
  },
  colAmount: {
    flex: 1.5,
    textAlign: "right",
  },
  headerText: {
    fontWeight: 700,
    fontSize: 9,
    color: "#444",
  },
  // Summary
  summary: {
    marginTop: 10,
    alignItems: "flex-end",
  },
  summaryRow: {
    flexDirection: "row",
    width: 200,
    justifyContent: "space-between",
    marginBottom: 4,
  },
  summaryLabel: {
    color: "#666",
  },
  totalRow: {
    flexDirection: "row",
    width: 200,
    justifyContent: "space-between",
    borderTopWidth: 2,
    borderTopColor: "#741717",
    paddingTop: 6,
    marginTop: 4,
  },
  totalLabel: {
    fontWeight: 700,
    fontSize: 12,
  },
  totalValue: {
    fontWeight: 700,
    fontSize: 12,
    color: "#741717",
  },
  // Footer
  footer: {
    position: "absolute",
    bottom: 40,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: "#e5e5e5",
    paddingTop: 10,
    textAlign: "center",
    fontSize: 8,
    color: "#999",
  },
});

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export interface InvoicePdfData {
  invoiceNumber: string;
  issuedAt: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  items: Array<{ description: string; amount: number }>;
  candidate: {
    name: string;
    email: string;
  };
  payment: {
    method: string;
    transactionId: string | null;
    paidAt: string | null;
  };
  exam: {
    title: string;
    date: string;
  };
}

const METHOD_LABELS: Record<string, string> = {
  PROMPTPAY: "PromptPay",
  CREDIT_CARD: "Credit Card",
  BANK_TRANSFER: "Bank Transfer",
  E_WALLET: "e-Wallet",
};

export function InvoiceTemplate({ data }: { data: InvoicePdfData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>U-Exam</Text>
            <Text style={styles.logoSub}>
              Enterprise-grade Examination Platform
            </Text>
          </View>
          <View>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>
              {data.invoiceNumber}
            </Text>
            <Text style={styles.invoiceNumber}>
              {formatDate(data.issuedAt)}
            </Text>
          </View>
        </View>

        {/* Candidate Info */}
        <View style={{ marginBottom: 20 }}>
          <Text style={styles.sectionTitle}>Bill To</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Name</Text>
            <Text style={styles.value}>{data.candidate.name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{data.candidate.email}</Text>
          </View>
        </View>

        {/* Payment Info */}
        <View style={{ marginBottom: 10 }}>
          <Text style={styles.sectionTitle}>Payment Details</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Method</Text>
            <Text style={styles.value}>
              {METHOD_LABELS[data.payment.method] || data.payment.method}
            </Text>
          </View>
          {data.payment.transactionId && (
            <View style={styles.row}>
              <Text style={styles.label}>Transaction ID</Text>
              <Text style={styles.value}>
                {data.payment.transactionId}
              </Text>
            </View>
          )}
          {data.payment.paidAt && (
            <View style={styles.row}>
              <Text style={styles.label}>Paid At</Text>
              <Text style={styles.value}>
                {formatDate(data.payment.paidAt)}
              </Text>
            </View>
          )}
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.colDescription, styles.headerText]}>
              Description
            </Text>
            <Text style={[styles.colQty, styles.headerText]}>Qty</Text>
            <Text style={[styles.colAmount, styles.headerText]}>
              Amount (THB)
            </Text>
          </View>
          {data.items.map((item, idx) => (
            <View key={idx} style={styles.tableRow}>
              <Text style={styles.colDescription}>{item.description}</Text>
              <Text style={styles.colQty}>1</Text>
              <Text style={styles.colAmount}>
                {formatCurrency(item.amount)}
              </Text>
            </View>
          ))}
        </View>

        {/* Summary */}
        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text>{formatCurrency(data.subtotal)}</Text>
          </View>
          {data.taxAmount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                Tax ({data.taxRate}%)
              </Text>
              <Text>{formatCurrency(data.taxAmount)}</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>
              THB {formatCurrency(data.total)}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            U-Exam | Enterprise-grade Examination Platform | This is a
            computer-generated invoice.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
