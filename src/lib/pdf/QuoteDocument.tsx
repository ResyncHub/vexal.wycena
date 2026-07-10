import path from "node:path";
import { Document, Page, View, Text, Image, StyleSheet, Font } from "@react-pdf/renderer";

Font.register({
  family: "Liberation Sans",
  fonts: [
    { src: path.join(process.cwd(), "src/lib/pdf/fonts/LiberationSans-Regular.ttf") },
    {
      src: path.join(process.cwd(), "src/lib/pdf/fonts/LiberationSans-Bold.ttf"),
      fontWeight: "bold",
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Liberation Sans",
    color: "#171717",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  logo: { width: 120, maxHeight: 60, objectFit: "contain" },
  companyBlock: { textAlign: "right" },
  companyName: { fontSize: 12, fontWeight: "bold", marginBottom: 2 },
  companyLine: { fontSize: 9, color: "#525252" },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 4 },
  subtitle: { fontSize: 10, color: "#525252", marginBottom: 16 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  infoBlock: { width: "48%" },
  infoLabel: { fontSize: 8, color: "#737373", marginBottom: 2, textTransform: "uppercase" },
  infoValue: { fontSize: 10, marginBottom: 1 },
  openingTitle: { fontSize: 11, fontWeight: "bold", marginTop: 16, marginBottom: 6 },
  table: { borderTopWidth: 1, borderTopColor: "#e5e5e5" },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#f5f5f5",
    paddingVertical: 5,
    paddingHorizontal: 4,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  colDesc: { width: "46%" },
  colDim: { width: "18%" },
  colFinish: { width: "18%" },
  colValue: { width: "18%", textAlign: "right" },
  headerCell: { fontSize: 8, fontWeight: "bold", color: "#525252", textTransform: "uppercase" },
  cell: { fontSize: 9 },
  summary: { marginTop: 20, alignSelf: "flex-end", width: "50%" },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  summaryLabel: { fontSize: 9, color: "#525252" },
  summaryValue: { fontSize: 9 },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 6,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#171717",
  },
  totalLabel: { fontSize: 12, fontWeight: "bold" },
  totalValue: { fontSize: 12, fontWeight: "bold" },
  footer: { position: "absolute", bottom: 40, left: 40, right: 40 },
  footerText: { fontSize: 8, color: "#737373", lineHeight: 1.4 },
});

export interface PdfCompany {
  name: string;
  address: string | null;
  nip: string | null;
  phone: string | null;
  email: string | null;
  bankAccount: string | null;
  logoUrl: string | null;
  footerTerms: string | null;
}

export interface PdfClient {
  name: string;
  address: string | null;
  nip: string | null;
  email: string | null;
  phone: string | null;
}

export interface PdfModuleLine {
  type: "STALY" | "JEZDNY";
  widthCm: number;
  heightCm: number;
  orientation: "POZIOMO" | "PIONOWO";
  finish: "MALOWANA_RAL" | "DREWNOPODOBNA";
  ralColor: string | null;
  okucieMaterial: "ALUMINIOWE" | "PLASTIKOWE";
  valuePln: number;
}

export interface PdfOpening {
  label: string;
  widthCm: number;
  modules: PdfModuleLine[];
  slidingRailValuePln: number | null;
}

export interface PdfQuote {
  number: string;
  createdAt: Date;
  validUntil: Date | null;
  discountPercent: number;
  installationPln: number;
  notes: string | null;
  totalPricePln: number;
}

const FINISH_LABEL: Record<string, string> = {
  MALOWANA_RAL: "malowana RAL",
  DREWNOPODOBNA: "drewnopodobna",
};

const ORIENTATION_LABEL: Record<string, string> = {
  POZIOMO: "lamele poziome",
  PIONOWO: "lamele pionowe",
};

function fmt(n: number): string {
  return n.toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " zł";
}

function fmtDate(d: Date | null): string {
  if (!d) return "—";
  return d.toLocaleDateString("pl-PL");
}

export function QuoteDocument({
  company,
  client,
  quote,
  openings,
  itemsSubtotalPln,
}: {
  company: PdfCompany;
  client: PdfClient | null;
  quote: PdfQuote;
  openings: PdfOpening[];
  itemsSubtotalPln: number;
}) {
  return (
    <Document title={`Wycena ${quote.number}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          {company.logoUrl ? (
            // eslint-disable-next-line jsx-a11y/alt-text
            <Image src={company.logoUrl} style={styles.logo} />
          ) : (
            <View />
          )}
          <View style={styles.companyBlock}>
            <Text style={styles.companyName}>{company.name}</Text>
            {company.address && <Text style={styles.companyLine}>{company.address}</Text>}
            {company.nip && <Text style={styles.companyLine}>NIP: {company.nip}</Text>}
            {company.phone && <Text style={styles.companyLine}>{company.phone}</Text>}
            {company.email && <Text style={styles.companyLine}>{company.email}</Text>}
          </View>
        </View>

        <Text style={styles.title}>Wycena {quote.number}</Text>
        <Text style={styles.subtitle}>
          Data wystawienia: {fmtDate(quote.createdAt)}
          {quote.validUntil ? `  ·  Ważna do: ${fmtDate(quote.validUntil)}` : ""}
        </Text>

        {client && (
          <View style={styles.infoRow}>
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>Dla</Text>
              <Text style={styles.infoValue}>{client.name}</Text>
              {client.address && <Text style={styles.infoValue}>{client.address}</Text>}
              {client.nip && <Text style={styles.infoValue}>NIP: {client.nip}</Text>}
              {client.email && <Text style={styles.infoValue}>{client.email}</Text>}
              {client.phone && <Text style={styles.infoValue}>{client.phone}</Text>}
            </View>
          </View>
        )}

        {openings.map((opening, i) => (
          <View key={i} wrap={false}>
            <Text style={styles.openingTitle}>
              {opening.label} (szerokość otworu {opening.widthCm} cm)
            </Text>
            <View style={styles.table}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.headerCell, styles.colDesc]}>Opis</Text>
                <Text style={[styles.headerCell, styles.colDim]}>Wymiary</Text>
                <Text style={[styles.headerCell, styles.colFinish]}>Wykończenie</Text>
                <Text style={[styles.headerCell, styles.colValue]}>Wartość</Text>
              </View>
              {opening.modules.map((m, j) => (
                <View key={j} style={styles.tableRow}>
                  <Text style={[styles.cell, styles.colDesc]}>
                    {m.type === "JEZDNY" ? "Moduł jezdny (przesuwny)" : "Moduł stały"},{" "}
                    {ORIENTATION_LABEL[m.orientation]}
                  </Text>
                  <Text style={[styles.cell, styles.colDim]}>
                    {m.widthCm}×{m.heightCm} cm
                  </Text>
                  <Text style={[styles.cell, styles.colFinish]}>
                    {FINISH_LABEL[m.finish]}
                    {m.ralColor ? `, ${m.ralColor}` : ""}
                  </Text>
                  <Text style={[styles.cell, styles.colValue]}>{fmt(m.valuePln)}</Text>
                </View>
              ))}
              {opening.slidingRailValuePln !== null && (
                <View style={styles.tableRow}>
                  <Text style={[styles.cell, styles.colDesc]}>System jezdny (szyna i prowadnica)</Text>
                  <Text style={[styles.cell, styles.colDim]}></Text>
                  <Text style={[styles.cell, styles.colFinish]}></Text>
                  <Text style={[styles.cell, styles.colValue]}>{fmt(opening.slidingRailValuePln)}</Text>
                </View>
              )}
            </View>
          </View>
        ))}

        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Suma pozycji</Text>
            <Text style={styles.summaryValue}>{fmt(itemsSubtotalPln)}</Text>
          </View>
          {quote.installationPln > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Montaż</Text>
              <Text style={styles.summaryValue}>{fmt(quote.installationPln)}</Text>
            </View>
          )}
          {quote.discountPercent > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Rabat</Text>
              <Text style={styles.summaryValue}>-{quote.discountPercent}%</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Do zapłaty</Text>
            <Text style={styles.totalValue}>{fmt(quote.totalPricePln)}</Text>
          </View>
        </View>

        {quote.notes && (
          <View style={{ marginTop: 20 }}>
            <Text style={styles.infoLabel}>Uwagi</Text>
            <Text style={styles.infoValue}>{quote.notes}</Text>
          </View>
        )}

        <View style={styles.footer} fixed>
          {company.bankAccount && (
            <Text style={styles.footerText}>Nr konta: {company.bankAccount}</Text>
          )}
          {company.footerTerms && <Text style={styles.footerText}>{company.footerTerms}</Text>}
        </View>
      </Page>
    </Document>
  );
}
