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

export interface SubscriptionConfirmationEmailProps {
  name: string;
  planName: string;
  amount: number;
  currency: string;
  expiresAt: string | null;
  dashboardUrl: string;
}

export function SubscriptionConfirmationEmail({
  name,
  planName,
  amount,
  currency,
  expiresAt,
  dashboardUrl,
}: SubscriptionConfirmationEmailProps) {
  const amountStr = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount);

  return (
    <Html>
      <Head />
      <Preview>Payment confirmed — {planName} plan activated</Preview>
      <Body style={body}>
        <Container style={container}>
          <div style={header}>
            <Heading style={logo}>FXAU</Heading>
          </div>

          <div style={card}>
            <div style={successBadge}>Payment Confirmed</div>
            <Heading as="h2" style={h2}>
              Welcome to {planName}!
            </Heading>
            <Text style={text}>Hi {name},</Text>
            <Text style={text}>
              Your payment has been processed and your <strong>{planName}</strong> plan is now
              active.
            </Text>

            <div style={receiptBox}>
              {[
                { label: "Plan", value: planName },
                { label: "Amount", value: amountStr },
                { label: "Currency", value: currency.toUpperCase() },
                ...(expiresAt
                  ? [{ label: "Renews / Expires", value: new Date(expiresAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) }]
                  : [{ label: "Type", value: "One-time payment" }]),
              ].map(({ label, value }) => (
                <div key={label} style={receiptRow}>
                  <Text style={receiptLabel}>{label}</Text>
                  <Text style={receiptValue}>{value}</Text>
                </div>
              ))}
            </div>

            <div style={buttonWrap}>
              <Button href={dashboardUrl} style={button}>
                Go to Dashboard
              </Button>
            </div>
          </div>

          <Hr style={hr} />
          <Text style={footer}>
            This is your payment confirmation for FXAU. Keep this email for your records.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

SubscriptionConfirmationEmail.PreviewProps = {
  name: "Alice",
  planName: "Basic",
  amount: 29,
  currency: "usd",
  expiresAt: "2026-05-26",
  dashboardUrl: "https://fxau.app/dashboard",
} satisfies SubscriptionConfirmationEmailProps;

export default SubscriptionConfirmationEmail;

const body: React.CSSProperties = { backgroundColor: "#f8fafc", fontFamily: "'Geist', 'Inter', -apple-system, sans-serif", margin: 0 };
const container: React.CSSProperties = { maxWidth: "560px", margin: "40px auto", padding: "0 20px" };
const header: React.CSSProperties = { textAlign: "center", marginBottom: "24px" };
const logo: React.CSSProperties = { color: "#2563eb", fontSize: "24px", fontWeight: "800", margin: 0 };

const card: React.CSSProperties = { backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #bbf7d0", padding: "36px 32px" };
const successBadge: React.CSSProperties = { display: "inline-block", backgroundColor: "#dcfce7", color: "#16a34a", fontSize: "11px", fontWeight: "700", letterSpacing: "0.1em", padding: "4px 10px", borderRadius: "100px", marginBottom: "16px" };
const h2: React.CSSProperties = { color: "#0f172a", fontSize: "22px", fontWeight: "700", margin: "0 0 16px" };
const text: React.CSSProperties = { color: "#475569", fontSize: "15px", lineHeight: "1.6", margin: "0 0 16px" };

const receiptBox: React.CSSProperties = { backgroundColor: "#f8fafc", borderRadius: "8px", padding: "20px", marginBottom: "24px" };
const receiptRow: React.CSSProperties = { display: "flex", justifyContent: "space-between", marginBottom: "8px" };
const receiptLabel: React.CSSProperties = { color: "#64748b", fontSize: "14px", margin: 0 };
const receiptValue: React.CSSProperties = { color: "#0f172a", fontSize: "14px", fontWeight: "600", margin: 0 };

const buttonWrap: React.CSSProperties = { textAlign: "center" };
const button: React.CSSProperties = { backgroundColor: "#2563eb", borderRadius: "8px", color: "#ffffff", fontSize: "15px", fontWeight: "600", padding: "12px 28px", textDecoration: "none", display: "inline-block" };
const hr: React.CSSProperties = { borderColor: "#e2e8f0", margin: "24px 0" };
const footer: React.CSSProperties = { color: "#94a3b8", fontSize: "12px", lineHeight: "1.5", textAlign: "center" };
