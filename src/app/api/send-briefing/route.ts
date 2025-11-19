import { Resend } from 'resend';
import { DailyBriefing } from '@/emails/DailyBriefing';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { email, userName } = await req.json();

    // Mock data (in production, this would come from your database/API)
    const marketSummary =
      "Markets opened higher today with tech stocks leading the rally. The S&P 500 gained 0.8% while the Nasdaq climbed 1.2%. Energy sector showed weakness amid oil price decline.";

    const topStocks = [
      {
        symbol: "AAPL",
        change: 2.4,
        reason: "Strong iPhone sales reported in Q4, beating analyst expectations by 15%.",
      },
      {
        symbol: "NVDA",
        change: 3.8,
        reason: "AI chip demand surge continues, new partnership with major cloud provider announced.",
      },
      {
        symbol: "TSLA",
        change: -1.2,
        reason: "Production concerns in Shanghai factory, analysts downgrade near-term targets.",
      },
    ];

    const aiInsight =
      "Market sentiment remains cautiously optimistic. Technical indicators suggest continued upward momentum in tech sector, but watch for resistance at key levels. Consider profit-taking if positions become overextended.";

    const data = await resend.emails.send({
      from: 'LumoTrade <briefing@lumotrade.com>',
      to: [email],
      subject: `🍋 Your Daily Market Briefing - ${new Date().toLocaleDateString()}`,
      react: DailyBriefing({
        userName,
        marketSummary,
        topStocks,
        aiInsight,
      }),
    });

    return Response.json({ success: true, id: data.id });
  } catch (error) {
    console.error('Email send error:', error);
    return Response.json({ error: 'Failed to send email' }, { status: 500 });
  }
}

