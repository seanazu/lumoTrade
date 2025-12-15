/**
 * Stock Quote API Route
 * GET /api/stock/quote/[symbol]
 * Returns real-time quote data for a specific stock
 */

import { NextRequest, NextResponse } from "next/server";
import { polygonClient } from "@/lib/api/clients/polygon-client";
import { fmpClient } from "@/lib/api/clients/fmp-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{
    symbol: string;
  }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { symbol } = await context.params;

    if (!symbol) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_SYMBOL",
            message: "Symbol parameter is required",
          },
          timestamp: Date.now(),
        },
        { status: 400 }
      );
    }

    const upperSymbol = symbol.toUpperCase();

    // Try Polygon first
    let quoteData = null;
    let source = "mock";

    if (polygonClient.isConfigured()) {
      const snapshot = await polygonClient.getSnapshot(upperSymbol);
      if (snapshot) {
        quoteData = {
          symbol: upperSymbol,
          price: snapshot.day?.c || snapshot.min?.c || 0,
          change: snapshot.todaysChange || 0,
          changePercent: snapshot.todaysChangePerc || 0,
          high: snapshot.day?.h || 0,
          low: snapshot.day?.l || 0,
          volume: snapshot.day?.v || 0,
          previousClose: snapshot.prevDay?.c || 0,
          source: "polygon",
        };
        source = "polygon";
      }
    }

    // Fallback to FMP if Polygon didn't work
    if (!quoteData && fmpClient.isConfigured()) {
      const fmpQuote = await fmpClient.getQuote(upperSymbol);
      if (fmpQuote) {
        quoteData = {
          symbol: upperSymbol,
          price: fmpQuote.price,
          change: fmpQuote.change,
          changePercent: fmpQuote.changesPercentage,
          high: fmpQuote.dayHigh,
          low: fmpQuote.dayLow,
          volume: fmpQuote.volume,
          previousClose: fmpQuote.previousClose,
          source: "fmp",
        };
        source = "fmp";
      }
    }

    // If no real data available, return error
    if (!quoteData) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NO_DATA",
            message: `No quote data available for ${upperSymbol}`,
          },
          timestamp: Date.now(),
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: quoteData,
      cached: false,
      source,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Error in /api/stock/quote:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: error instanceof Error ? error.message : "Unknown error",
        },
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}
