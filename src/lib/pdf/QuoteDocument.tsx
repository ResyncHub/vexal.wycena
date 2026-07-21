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

const ACCENT = "#1c2333";
const ACCENT_SOFT = "#eef0f4";
const BORDER = "#dfe1e6";
const MUTED = "#6b7280";

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
    marginBottom: 12,
  },
  logo: { width: 130, maxHeight: 56, objectFit: "contain" },
  companyBlock: { textAlign: "right" },
  companyName: { fontSize: 13, fontWeight: "bold", marginBottom: 3, color: ACCENT },
  companyLine: { fontSize: 8.5, color: MUTED },
  headerRule: { height: 2, backgroundColor: ACCENT, marginBottom: 20 },

  title: { fontSize: 19, fontWeight: "bold", color: ACCENT, marginBottom: 3 },
  subtitle: { fontSize: 9, color: MUTED, marginBottom: 16 },

  infoRow: { flexDirection: "row", gap: 12, marginBottom: 22 },
  infoBox: {
    flex: 1,
    backgroundColor: ACCENT_SOFT,
    borderLeftWidth: 3,
    borderLeftColor: ACCENT,
    padding: 10,
  },
  infoLabel: {
    fontSize: 7.5,
    fontWeight: "bold",
    color: ACCENT,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  infoName: { fontSize: 10, fontWeight: "bold", marginBottom: 2 },
  infoValue: { fontSize: 9, color: "#3f3f46", marginBottom: 1, lineHeight: 1.3 },

  sectionLabel: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 6,
  },
  sectionBullet: { width: 6, height: 6, backgroundColor: ACCENT },
  sectionTitle: { fontSize: 10, fontWeight: "bold", color: ACCENT, textTransform: "uppercase" },

  openingTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#27272a",
    marginTop: 10,
    marginBottom: 6,
  },

  moduleCard: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 3,
    padding: 10,
    marginBottom: 8,
  },
  moduleHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 5,
  },
  moduleTitle: { fontSize: 10, fontWeight: "bold" },
  moduleValue: { fontSize: 12, fontWeight: "bold", color: ACCENT },
  specLine: { fontSize: 9, color: "#3f3f46", marginBottom: 2, lineHeight: 1.3 },
  specBullet: { color: MUTED },

  summary: { marginTop: 14, alignSelf: "flex-end", width: "55%" },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  summaryLabel: { fontSize: 9, color: MUTED },
  summaryValue: { fontSize: 9 },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 6,
    backgroundColor: ACCENT,
  },
  totalLabel: { fontSize: 11, fontWeight: "bold", color: "#ffffff" },
  totalValue: { fontSize: 13, fontWeight: "bold", color: "#ffffff" },

  footer: { position: "absolute", bottom: 40, left: 40, right: 40 },
  footerRule: { height: 0.5, backgroundColor: BORDER, marginBottom: 6 },
  footerText: { fontSize: 8, color: MUTED, lineHeight: 1.4 },
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
  /** Wartość tej pozycji - dla modułów jezdnych zawiera już doliczony
   * udział we wspólnej szynie/prowadnicy otworu, żeby była jedna cena. */
  valuePln: number;
  hasSlidingSystem: boolean;
}

export interface PdfOpening {
  label: string;
  modules: PdfModuleLine[];
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
  POZIOMO: "poziome",
  PIONOWO: "pionowe",
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
  let counter = 0;
  const moduleNumbers = openings.map((opening) => opening.modules.map(() => ++counter));

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
        <View style={styles.headerRule} />

        <Text style={styles.title}>WYCENA NR {quote.number}</Text>
        <Text style={styles.subtitle}>
          Data wystawienia: {fmtDate(quote.createdAt)}
          {quote.validUntil ? `   ·   Ważna do: ${fmtDate(quote.validUntil)}` : ""}
        </Text>

        <View style={styles.infoRow}>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Wystawia</Text>
            <Text style={styles.infoName}>{company.name}</Text>
            {company.address && <Text style={styles.infoValue}>{company.address}</Text>}
            {company.nip && <Text style={styles.infoValue}>NIP: {company.nip}</Text>}
            {company.email && <Text style={styles.infoValue}>{company.email}</Text>}
          </View>
          {client && (
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Dla</Text>
              <Text style={styles.infoName}>{client.name}</Text>
              {client.address && <Text style={styles.infoValue}>{client.address}</Text>}
              {client.nip && <Text style={styles.infoValue}>NIP: {client.nip}</Text>}
              {client.email && <Text style={styles.infoValue}>{client.email}</Text>}
              {client.phone && <Text style={styles.infoValue}>{client.phone}</Text>}
            </View>
          )}
        </View>

        <View style={styles.sectionLabel}>
          <View style={styles.sectionBullet} />
          <Text style={styles.sectionTitle}>Specyfikacja i wycena</Text>
        </View>

        {openings.map((opening, i) => (
          <View key={i} wrap={false}>
            <Text style={styles.openingTitle}>{opening.label}</Text>
            {opening.modules.map((m, j) => {
              return (
                <View key={j} style={styles.moduleCard}>
                  <View style={styles.moduleHeaderRow}>
                    <Text style={styles.moduleTitle}>
                      Moduł {moduleNumbers[i][j]} · {m.type === "JEZDNY" ? "przesuwny" : "stały"}
                    </Text>
                    <Text style={styles.moduleValue}>{fmt(m.valuePln)}</Text>
                  </View>
                  <Text style={styles.specLine}>
                    <Text style={styles.specBullet}>Lamele: </Text>
                    {FINISH_LABEL[m.finish]}
                    {m.ralColor ? `, ${m.ralColor}` : ""}, ustawienie {ORIENTATION_LABEL[m.orientation]}
                  </Text>
                  <Text style={styles.specLine}>
                    <Text style={styles.specBullet}>Rama i okucia: </Text>
                    rama aluminiowa, okucia {m.okucieMaterial === "ALUMINIOWE" ? "aluminiowe" : "plastikowe"}
                  </Text>
                  {m.hasSlidingSystem && (
                    <Text style={styles.specLine}>
                      <Text style={styles.specBullet}>System przesuwny: </Text>
                      szyna górna, prowadnica dolna, wózek jezdny, rolki prowadzące
                    </Text>
                  )}
                  <Text style={styles.specLine}>
                    <Text style={styles.specBullet}>Wymiary: </Text>
                    {m.widthCm}×{m.heightCm} cm
                  </Text>
                </View>
              );
            })}
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
          <View style={styles.footerRule} />
          {company.bankAccount && (
            <Text style={styles.footerText}>Nr konta: {company.bankAccount}</Text>
          )}
          {company.footerTerms && <Text style={styles.footerText}>{company.footerTerms}</Text>}
        </View>
      </Page>
    </Document>
  );
}
