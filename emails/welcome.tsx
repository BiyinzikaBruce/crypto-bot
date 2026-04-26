import {
  Html,
  Head,
  Body,
  Container,
  Heading,
  Text,
  Button,
  Hr,
  Link,
  Preview,
} from "@react-email/components";

interface WelcomeEmailProps {
  name: string;
  loginUrl: string;
}

export function WelcomeEmail({ name, loginUrl }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to FXAU — your automated trading platform</Preview>
      <Body style={body}>
        <Container style={container}>
          {/* Header */}
          <div style={header}>
            <Heading style={logo}>FXAU</Heading>
          </div>

          {/* Body */}
          <div style={card}>
            <Heading as="h2" style={h2}>
              Welcome, {name}!
            </Heading>
            <Text style={text}>
              Your FXAU account is ready. You can now build no-code trading strategies, run
              backtests, and deploy automated bots connected to your MetaTrader 5 account.
            </Text>

            <Text style={stepsHeading}>Get started in 3 steps:</Text>
            {[
              "Connect your MT5 broker account in Settings",
              "Build a trading strategy using the no-code rule builder",
              "Run a backtest, then deploy your bot",
            ].map((step, i) => (
              <div key={i} style={stepRow}>
                <span style={stepNumber}>{i + 1}</span>
                <Text style={stepText}>{step}</Text>
              </div>
            ))}

            <div style={buttonWrap}>
              <Button href={loginUrl} style={button}>
                Go to Dashboard
              </Button>
            </div>
          </div>

          <Hr style={hr} />
          <Text style={footer}>
            You received this email because you created an FXAU account. If this was not you,
            please ignore this email or{" "}
            <Link href="mailto:support@fxau.app" style={link}>
              contact support
            </Link>
            .
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

WelcomeEmail.PreviewProps = {
  name: "Alice",
  loginUrl: "https://fxau.app/dashboard",
} satisfies WelcomeEmailProps;

export default WelcomeEmail;

// ─── Styles ───────────────────────────────────────────────────────────────────

const body: React.CSSProperties = {
  backgroundColor: "#f8fafc",
  fontFamily: "'Geist', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  margin: 0,
  padding: 0,
};

const container: React.CSSProperties = {
  maxWidth: "560px",
  margin: "40px auto",
  padding: "0 20px",
};

const header: React.CSSProperties = {
  textAlign: "center",
  marginBottom: "24px",
};

const logo: React.CSSProperties = {
  color: "#2563eb",
  fontSize: "24px",
  fontWeight: "800",
  letterSpacing: "-0.5px",
  margin: 0,
};

const card: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  padding: "36px 32px",
};

const h2: React.CSSProperties = {
  color: "#0f172a",
  fontSize: "22px",
  fontWeight: "700",
  margin: "0 0 16px",
  letterSpacing: "-0.3px",
};

const text: React.CSSProperties = {
  color: "#475569",
  fontSize: "15px",
  lineHeight: "1.6",
  margin: "0 0 20px",
};

const stepsHeading: React.CSSProperties = {
  color: "#0f172a",
  fontSize: "14px",
  fontWeight: "600",
  margin: "0 0 12px",
};

const stepRow: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: "12px",
  marginBottom: "10px",
};

const stepNumber: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "22px",
  height: "22px",
  borderRadius: "50%",
  backgroundColor: "#2563eb",
  color: "#ffffff",
  fontSize: "12px",
  fontWeight: "700",
  flexShrink: 0,
};

const stepText: React.CSSProperties = {
  color: "#475569",
  fontSize: "14px",
  lineHeight: "1.5",
  margin: 0,
};

const buttonWrap: React.CSSProperties = {
  textAlign: "center",
  marginTop: "28px",
};

const button: React.CSSProperties = {
  backgroundColor: "#2563eb",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: "600",
  padding: "12px 28px",
  textDecoration: "none",
  display: "inline-block",
};

const hr: React.CSSProperties = {
  borderColor: "#e2e8f0",
  margin: "24px 0",
};

const footer: React.CSSProperties = {
  color: "#94a3b8",
  fontSize: "12px",
  lineHeight: "1.5",
  textAlign: "center",
};

const link: React.CSSProperties = {
  color: "#2563eb",
  textDecoration: "underline",
};
