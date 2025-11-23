/**
 * Market Indexes API Route
 * GET /api/market/indexes
 * Returns real-time data for major market indexes
 * 
 * Note: Uses FMP (Financial Modeling Prep) for index data since
 * Polygon.io requires a paid plan for indices. FMP supports indices
 * on both free and paid tiers.
 */

import { NextResponse } from "next/server";
import { fmpClient } from "@/lib/api/clients/fmp-client";
import { IndexData } from "@/resources/mock-data/indexes";
import { MOCK_INDEXES } from "@/resources/mock-data/indexes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Major index symbols (FMP uses same symbols as Yahoo Finance)
const INDEX_SYMBOLS = ["^GSPC", "^DJI", "^IXIC", "^RUT"];

/**
 * Transform FMP quote to IndexData format
 */
function transformToIndexData(
  symbol: string,
  quote: any,
  mockData: IndexData
): IndexData {
  try {
    return {
      symbol,
      name: mockData.name,
      price: quote.price || mockData.price,
      change: quote.change || mockData.change,
      changePercent: quote.changesPercentage || mockData.changePercent,
      high: quote.dayHigh || mockData.high,
      low: quote.dayLow || mockData.low,
      volume: quote.volume || mockData.volume,
      // Keep mock percentile data for now (would need historical data for real calculation)
      p0: mockData.p0,
      p50: quote.price || mockData.price, // Use current price as P50
      p90: mockData.p90,
    };
  } catch (error) {
    console.error(`Error transforming data for ${symbol}:`, error);
    return mockData;
  }
}

export async function GET() {
  try {
    // Check if FMP is configured
    if (!fmpClient.isConfigured()) {
      console.error("FMP API not configured.");
      return NextResponse.json(
        {
          success: false,
          error: "FMP API is not configured. Add FMP_API_KEY to .env.local",
          timestamp: Date.now(),
        },
        { status: 503 }
      );
    }

    // Fetch quotes for all indexes
    const quotes = await fmpClient.getQuotes(INDEX_SYMBOLS);

    // Debug logging
    console.log("📊 FMP Response Summary:");
    console.log(`   Total symbols requested: ${INDEX_SYMBOLS.length}`);
    console.log(`   Total quotes received: ${quotes.size}`);
    quotes.forEach((quote, symbol) => {
      console.log(`   ${symbol}: $${quote.price} (${quote.changesPercentage > 0 ? '+' : ''}${quote.changesPercentage?.toFixed(2)}%)`);
    });

    // Transform data
    const indexesData: IndexData[] = INDEX_SYMBOLS.map((symbol) => {
      const quote = quotes.get(symbol);
      const mockData = MOCK_INDEXES.find((idx) => idx.symbol === symbol);

      if (!mockData) {
        throw new Error(`Mock data not found for ${symbol}`);
      }

      // If we have real data, transform it; otherwise use mock
      if (quote) {
        return transformToIndexData(symbol, quote, mockData);
      }

      console.warn(`⚠️  No data received for ${symbol}, using fallback`);
      return mockData;
    });

    const hasRealData = quotes.size > 0;

    return NextResponse.json({
      success: true,
      data: indexesData,
      cached: false,
      source: hasRealData ? "fmp" : "mock",
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Error in /api/market/indexes:", error);

    // Return error response (don't hide with mock data)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}
