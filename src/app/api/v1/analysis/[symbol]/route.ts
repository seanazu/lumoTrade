import { NextRequest, NextResponse } from 'next/server';

function validateAPIKey(apiKey: string | null): boolean {
  return apiKey === process.env.API_KEY_SECRET || apiKey?.startsWith('lm_');
}

export async function GET(
  request: NextRequest,
  { params }: { params: { symbol: string } }
) {
  const apiKey = request.headers.get('x-api-key');

  if (!validateAPIKey(apiKey)) {
    return NextResponse.json(
      { error: 'Invalid or missing API key' },
      { status: 401 }
    );
  }

  const { symbol } = params;

  // Mock AI analysis
  const analysis = {
    symbol: symbol.toUpperCase(),
    sentiment: Math.random() > 0.5 ? 'bullish' : 'bearish',
    confidence: Math.floor(Math.random() * 40) + 60,
    summary: `AI analysis suggests ${symbol} shows ${Math.random() > 0.5 ? 'strong' : 'moderate'} momentum with ${Math.random() > 0.5 ? 'positive' : 'neutral'} technical indicators.`,
    technicals: {
      rsi: Math.floor(Math.random() * 40) + 30,
      macd: Math.random() > 0.5 ? 'bullish' : 'bearish',
      trend: Math.random() > 0.5 ? 'uptrend' : 'downtrend',
    },
    priceTargets: {
      short: 180 + Math.random() * 10,
      medium: 185 + Math.random() * 15,
      long: 200 + Math.random() * 20,
    },
    riskLevel: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
    timestamp: Date.now(),
  };

  return NextResponse.json({ success: true, data: analysis });
}

