import { NextRequest, NextResponse } from 'next/server';

// API Key validation (in production, check against database)
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

  // Mock data (in production, fetch from real data source)
  const data = {
    symbol: symbol.toUpperCase(),
    price: 178.25 + Math.random() * 5,
    change: (Math.random() - 0.5) * 5,
    changePercent: (Math.random() - 0.5) * 3,
    volume: Math.floor(Math.random() * 10000000) + 5000000,
    marketCap: 2800000000000,
    pe: 28.5,
    high52Week: 199.62,
    low52Week: 124.17,
    timestamp: Date.now(),
  };

  return NextResponse.json({ success: true, data });
}

