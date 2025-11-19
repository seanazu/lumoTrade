import { type FC } from "react";
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Link,
  Heading,
  Hr,
} from "@react-email/components";

interface DailyBriefingProps {
  userName: string;
  marketSummary: string;
  topStocks: Array<{
    symbol: string;
    change: number;
    reason: string;
  }>;
  aiInsight: string;
}

export const DailyBriefing: FC<DailyBriefingProps> = ({
  userName,
  marketSummary,
  topStocks,
  aiInsight,
}) => (
  <Html>
    <Head />
    <Body style={main}>
      <Container style={container}>
        {/* Header */}
        <Section style={header}>
          <Heading style={h1}>🍋 Good Morning, {userName}!</Heading>
          <Text style={paragraph}>Your Daily Market Intelligence from LumoTrade</Text>
        </Section>

        {/* Market Summary */}
        <Section style={section}>
          <Heading style={h2}>📊 Market Overview</Heading>
          <Text style={paragraph}>{marketSummary}</Text>
        </Section>

        <Hr style={hr} />

        {/* Top Movers */}
        <Section style={section}>
          <Heading style={h2}>🚀 Stocks to Watch</Heading>
          {topStocks.map((stock) => (
            <div key={stock.symbol} style={stockCard}>
              <Text style={stockSymbol}>
                {stock.symbol}{" "}
                <span
                  style={{
                    color: stock.change >= 0 ? "#22c55e" : "#ef4444",
                    fontWeight: "bold",
                  }}
                >
                  {stock.change >= 0 ? "+" : ""}
                  {stock.change.toFixed(2)}%
                </span>
              </Text>
              <Text style={stockReason}>{stock.reason}</Text>
            </div>
          ))}
        </Section>

        <Hr style={hr} />

        {/* AI Insight */}
        <Section style={section}>
          <Heading style={h2}>🤖 AI Market Insight</Heading>
          <Text style={aiInsightBox}>{aiInsight}</Text>
        </Section>

        {/* Footer */}
        <Section style={footer}>
          <Text style={footerText}>
            <Link href="https://lumotrade.com" style={link}>
              Open LumoTrade
            </Link>
            {" · "}
            <Link href="https://lumotrade.com/settings" style={link}>
              Manage Preferences
            </Link>
          </Text>
          <Text style={footerText}>
            © {new Date().getFullYear()} LumoTrade. AI-Powered Stock Intelligence.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  maxWidth: "600px",
};

const header = {
  padding: "32px 24px",
  backgroundImage: "linear-gradient(135deg, #84cc16 0%, #10b981 100%)",
  borderRadius: "8px 8px 0 0",
};

const h1 = {
  color: "#ffffff",
  fontSize: "28px",
  fontWeight: "bold",
  margin: "0 0 8px",
};

const h2 = {
  color: "#1a1a2e",
  fontSize: "20px",
  fontWeight: "bold",
  margin: "0 0 16px",
};

const paragraph = {
  color: "#ffffff",
  fontSize: "14px",
  lineHeight: "24px",
  margin: 0,
};

const section = {
  padding: "24px",
};

const stockCard = {
  backgroundColor: "#f9fafb",
  padding: "16px",
  borderRadius: "8px",
  marginBottom: "12px",
  borderLeft: "4px solid #84cc16",
};

const stockSymbol = {
  fontSize: "16px",
  fontWeight: "bold",
  color: "#1a1a2e",
  margin: "0 0 8px",
};

const stockReason = {
  fontSize: "14px",
  color: "#64748b",
  margin: 0,
  lineHeight: "20px",
};

const aiInsightBox = {
  backgroundColor: "#eff6ff",
  padding: "16px",
  borderRadius: "8px",
  fontSize: "14px",
  lineHeight: "22px",
  color: "#1e293b",
  borderLeft: "4px solid #3b82f6",
};

const hr = {
  borderColor: "#e2e8f0",
  margin: "20px 0",
};

const footer = {
  padding: "24px",
  textAlign: "center" as const,
};

const footerText = {
  color: "#64748b",
  fontSize: "12px",
  lineHeight: "20px",
};

const link = {
  color: "#84cc16",
  textDecoration: "underline",
};

export default DailyBriefing;

