/**
 * Market News API Route
 * GET /api/market/news?limit=10
 * Returns latest market news with sentiment analysis
 */

import { NextRequest, NextResponse } from "next/server";
import { marketauxClient } from "@/lib/api/clients/marketaux-client";
import { MarketauxClient } from "@/lib/api/clients/marketaux-client";
import {
  MarketStory,
  MOCK_MARKET_STORIES,
} from "@/resources/mock-data/indexes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Transform Marketaux article to MarketStory format
 */
function transformToMarketStory(article: any): MarketStory {
  return {
    title: article.title,
    summary: article.description || article.snippet || "",
    sentiment: MarketauxClient.mapSentiment(article.sentiment?.score || 0),
    importance: MarketauxClient.mapImportance(article),
    time: formatTimeAgo(article.published_at),
    source: article.source || "Market News",
  };
}

/**
 * Format timestamp to relative time (e.g., "2h ago")
 */
function formatTimeAgo(timestamp: string): string {
  try {
    const now = new Date();
    const published = new Date(timestamp);
    const diffMs = now.getTime() - published.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    }
  } catch {
    return "Recently";
  }
}

export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    // Check if Marketaux is configured
    if (!marketauxClient.isConfigured()) {
      console.error("Marketaux API not configured.");
      return NextResponse.json(
        {
          success: false,
          error: "Marketaux API is not configured. Add MARKETAUX_API_KEY to .env.local",
          timestamp: Date.now(),
        },
        { status: 503 }
      );
    }

    // Fetch news from Marketaux
    const articles = await marketauxClient.getTopMarketNews(limit);

    // Transform to MarketStory format
    const stories: MarketStory[] = articles.map(transformToMarketStory);

    // If no articles found, return empty array (not an error)
    if (stories.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        cached: false,
        source: "marketaux",
        timestamp: Date.now(),
      });
    }

    return NextResponse.json({
      success: true,
      data: stories,
      cached: false,
      source: "marketaux",
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Error in /api/market/news:", error);

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
