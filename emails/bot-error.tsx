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

export interface BotErrorEmailProps {
  name: string;
  botName: string;
  strategyName: string;
  errorMessage: string;
  settingsUrl: string;
}

export function BotErrorEmail({
  name,
  botName,
  strategyName,
  errorMessage,
  settingsUrl,
}: BotErrorEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Bot Error — {botName} has stopped due to an error</Preview>
      <Body style={body}>
        <Container style={container}>
          <div style={header}>
            <Heading style={logo}>FXAU</Heading>
          </div>

          <div style={card}>
            <div style={alertBadge}>ERROR</div>
            <Heading as="h2" style={h2}>
              Bot Stopped
            </Heading>
            <Text style={text}>Hi {name},</Text>
            <Text style={text}>
              Your bot <strong>{botName}</strong> running strategy{" "}
              <strong>{strategyName}</strong> has stopped due to an error.
            </Text>

            <div style={errorBox}>
              <Text style={errorLabel}>Error Details</Text>
              <Text style={errorText}>{errorMessage}</Text>
            </div>

            <Text style={text}>
              All open positions have been closed automatically. Check your MT5 connection and
              strategy configuration before restarting the bot.
            </Text>

            <div style={buttonWrap}>
              <Button href={settingsUrl} style={button}>
                Go to Settings
              </Button>
            </div>
          </div>

          <Hr style={hr} />
          <Text style={footer}>
            You received this alert because you have an active FXAU bot. To stop these alerts,
            disconnect your Telegram or update your notification preferences.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

BotErrorEmail.PreviewProps = {
  name: "Alice",
  botName: "RSI Scalper Bot",
  strategyName: "RSI Breakout XAUUSD",
  errorMessage: "MT5 connection lost — broker server unreachable",
  settingsUrl: "https://fxau.app/dashboard/settings",
} satisfies BotErrorEmailProps;

export default BotErrorEmail;

const body: React.CSSProperties = { backgroundColor: "#f8fafc", fontFamily: "'Geist', 'Inter', -apple-system, sans-serif", margin: 0 };
const container: React.CSSProperties = { maxWidth: "560px", margin: "40px auto", padding: "0 20px" };
const header: React.CSSProperties = { textAlign: "center", marginBottom: "24px" };
const logo: React.CSSProperties = { color: "#2563eb", fontSize: "24px", fontWeight: "800", margin: 0 };

const card: React.CSSProperties = { backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #fecaca", padding: "36px 32px" };
const alertBadge: React.CSSProperties = { display: "inline-block", backgroundColor: "#fee2e2", color: "#dc2626", fontSize: "11px", fontWeight: "700", letterSpacing: "0.1em", padding: "4px 10px", borderRadius: "100px", marginBottom: "16px" };
const h2: React.CSSProperties = { color: "#0f172a", fontSize: "22px", fontWeight: "700", margin: "0 0 16px" };
const text: React.CSSProperties = { color: "#475569", fontSize: "15px", lineHeight: "1.6", margin: "0 0 16px" };

const errorBox: React.CSSProperties = { backgroundColor: "#fff1f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "16px", marginBottom: "20px" };
const errorLabel: React.CSSProperties = { color: "#dc2626", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 6px" };
const errorText: React.CSSProperties = { color: "#7f1d1d", fontSize: "14px", fontFamily: "monospace", margin: 0 };

const buttonWrap: React.CSSProperties = { textAlign: "center", marginTop: "8px" };
const button: React.CSSProperties = { backgroundColor: "#2563eb", borderRadius: "8px", color: "#ffffff", fontSize: "15px", fontWeight: "600", padding: "12px 28px", textDecoration: "none", display: "inline-block" };
const hr: React.CSSProperties = { borderColor: "#e2e8f0", margin: "24px 0" };
const footer: React.CSSProperties = { color: "#94a3b8", fontSize: "12px", lineHeight: "1.5", textAlign: "center" };
