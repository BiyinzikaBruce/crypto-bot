import {
  Html,
  Head,
  Body,
  Container,
  Heading,
  Text,
  Button,
  Hr,
  Preview,
} from "@react-email/components";

export interface TradeSummaryEmailProps {
  name: string;
  date: string;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  netPnl: number;
  winRate: number;
  dashboardUrl: string;
}

export function TradeSummaryEmail({
  name,
  date,
  totalTrades,
  winningTrades,
  losingTrades,
  netPnl,
  winRate,
  dashboardUrl,
}: TradeSummaryEmailProps) {
  const isProfit = netPnl >= 0;
  const pnlStr = `${isProfit ? "+" : ""}$${Math.abs(netPnl).toFixed(2)}`;

  return (
    <Html>
      <Head />
      <Preview>
        Daily Trade Summary — {pnlStr} P&L on {date}
      </Preview>
      <Body style={body}>
        <Container style={container}>
          <div style={header}>
            <Heading style={logo}>FXAU</Heading>
          </div>

          <div style={card}>
            <Heading as="h2" style={h2}>
              Daily Trade Summary
            </Heading>
            <Text style={dateText}>{date}</Text>
            <Text style={greeting}>Hi {name},</Text>
            <Text style={text}>Here is your trading summary for today.</Text>

            {/* P&L hero */}
            <div style={pnlBox}>
              <Text style={pnlLabel}>Net P&L</Text>
              <Text style={{ ...pnlValue, color: isProfit ? "#22c55e" : "#ef4444" }}>
                {pnlStr}
              </Text>
            </div>

            {/* Stats grid */}
            <div style={statsGrid}>
              {[
                { label: "Total Trades", value: String(totalTrades) },
                { label: "Win Rate", value: `${winRate.toFixed(1)}%` },
                { label: "Winners", value: String(winningTrades), color: "#22c55e" },
                { label: "Losers", value: String(losingTrades), color: "#ef4444" },
              ].map(({ label, value, color }) => (
                <div key={label} style={statCard}>
                  <Text style={statLabel}>{label}</Text>
                  <Text style={{ ...statValue, ...(color ? { color } : {}) }}>{value}</Text>
                </div>
              ))}
            </div>

            <div style={buttonWrap}>
              <Button href={dashboardUrl} style={button}>
                View Full Report
              </Button>
            </div>
          </div>

          <Hr style={hr} />
          <Text style={footer}>
            You are receiving this because you have an active FXAU account with trades today.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

TradeSummaryEmail.PreviewProps = {
  name: "Alice",
  date: "April 26, 2026",
  totalTrades: 12,
  winningTrades: 8,
  losingTrades: 4,
  netPnl: 142.5,
  winRate: 66.7,
  dashboardUrl: "https://fxau.app/dashboard/trades",
} satisfies TradeSummaryEmailProps;

export default TradeSummaryEmail;

// ─── Styles ───────────────────────────────────────────────────────────────────

const body: React.CSSProperties = {
  backgroundColor: "#f8fafc",
  fontFamily: "'Geist', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  margin: 0,
};

const container: React.CSSProperties = { maxWidth: "560px", margin: "40px auto", padding: "0 20px" };
const header: React.CSSProperties = { textAlign: "center", marginBottom: "24px" };
const logo: React.CSSProperties = { color: "#2563eb", fontSize: "24px", fontWeight: "800", margin: 0 };

const card: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  padding: "36px 32px",
};

const h2: React.CSSProperties = { color: "#0f172a", fontSize: "22px", fontWeight: "700", margin: "0 0 4px" };
const dateText: React.CSSProperties = { color: "#94a3b8", fontSize: "13px", margin: "0 0 20px" };
const greeting: React.CSSProperties = { color: "#0f172a", fontSize: "15px", fontWeight: "600", margin: "0 0 4px" };
const text: React.CSSProperties = { color: "#475569", fontSize: "15px", lineHeight: "1.6", margin: "0 0 24px" };

const pnlBox: React.CSSProperties = {
  textAlign: "center",
  backgroundColor: "#f8fafc",
  borderRadius: "8px",
  padding: "20px",
  marginBottom: "20px",
};
const pnlLabel: React.CSSProperties = { color: "#64748b", fontSize: "12px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 4px" };
const pnlValue: React.CSSProperties = { fontSize: "36px", fontWeight: "800", fontFamily: "monospace", margin: 0 };

const statsGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "12px",
  marginBottom: "24px",
};
const statCard: React.CSSProperties = {
  backgroundColor: "#f8fafc",
  borderRadius: "8px",
  padding: "14px 16px",
};
const statLabel: React.CSSProperties = { color: "#64748b", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 4px" };
const statValue: React.CSSProperties = { color: "#0f172a", fontSize: "20px", fontWeight: "700", fontFamily: "monospace", margin: 0 };

const buttonWrap: React.CSSProperties = { textAlign: "center" };
const button: React.CSSProperties = { backgroundColor: "#2563eb", borderRadius: "8px", color: "#ffffff", fontSize: "15px", fontWeight: "600", padding: "12px 28px", textDecoration: "none", display: "inline-block" };
const hr: React.CSSProperties = { borderColor: "#e2e8f0", margin: "24px 0" };
const footer: React.CSSProperties = { color: "#94a3b8", fontSize: "12px", lineHeight: "1.5", textAlign: "center" };
