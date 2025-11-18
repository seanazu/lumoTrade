"use client";

import * as React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/tanstack-query/queryClient";
import { AppShell } from "@/components/design-system/organisms/AppShell";
import { ThemeToggle } from "@/components/design-system/atoms/ThemeToggle";
import { GlassCard } from "@/components/design-system/organisms/GlassCard";
import { Badge } from "@/components/design-system/atoms/Badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { TrendingUp, TrendingDown, Minus, Brain, BarChart3, Sparkles } from "lucide-react";
import { MOCK_INDEXES, MOCK_INDEX_ANALYSIS, MOCK_MARKET_STORIES, MOCK_MARKET_PREDICTION } from "@/resources/mock-data/indexes";
import { motion } from "framer-motion";
import { fadeInScale, staggerChildren } from "@/utils/animations/variants";
import { formatPrice, formatPercentage } from "@/utils/formatting/numbers";
import Link from "next/link";
import { Button } from "@/components/design-system/atoms/Button";

// Generate mock chart data for indexes
const generateIndexChart = (basePrice: number) => {
  const data = [];
  let price = basePrice * 0.98;
  for (let i = 0; i < 30; i++) {
    const change = (Math.random() - 0.48) * (basePrice * 0.005);
    price = price + change;
    data.push({
      time: `${i}h`,
      price: parseFloat(price.toFixed(2)),
    });
  }
  return data;
};

function MarketOverview() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Hero Section */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeInScale}
        className="text-center py-8"
      >
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Market Intelligence Dashboard
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Real-time market analysis powered by AI. Track indexes, predictions, and top stories in one place.
        </p>
      </motion.div>

      {/* Index Cards Grid */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerChildren}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {MOCK_INDEXES.map((index) => {
          const isPositive = index.change >= 0;
          return (
            <motion.div key={index.symbol} variants={fadeInScale}>
              <GlassCard hover className="p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-1">
                      {index.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold tabular-nums">
                        {formatPrice(index.price)}
                      </span>
                      <Badge variant={isPositive ? "bullish" : "bearish"}>
                        {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      </Badge>
                    </div>
                    <div className={`text-sm font-semibold ${isPositive ? "text-green-500" : "text-red-500"}`}>
                      {isPositive && "+"}{formatPrice(index.change)} ({formatPercentage(index.changePercent)})
                    </div>
                  </div>

                  {/* P0, P50, P90 */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">P0</span>
                      <span className="font-semibold">{formatPrice(index.p0)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">P50</span>
                      <span className="font-semibold">{formatPrice(index.p50)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">P90</span>
                      <span className="font-semibold">{formatPrice(index.p90)}</span>
                    </div>
                  </div>

                  {/* Range indicator */}
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
                      style={{
                        width: `${((index.price - index.p0) / (index.p90 - index.p0)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Index Charts */}
      <GlassCard className="p-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          Index Performance (30 Days)
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {MOCK_INDEXES.map((index) => {
            const chartData = generateIndexChart(index.price);
            return (
              <div key={index.symbol}>
                <h3 className="text-sm font-semibold mb-3">{index.name}</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="time" stroke="rgba(255,255,255,0.5)" style={{ fontSize: '12px' }} />
                    <YAxis stroke="rgba(255,255,255,0.5)" style={{ fontSize: '12px' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(20, 20, 31, 0.95)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                      }}
                    />
                    <Line type="monotone" dataKey="price" stroke="#6366f1" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* Top Market Stories */}
      <GlassCard className="p-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Sparkles className="h-6 w-6" />
          Top Market Stories
        </h2>
        <div className="space-y-4">
          {MOCK_MARKET_STORIES.map((story, index) => (
            <div
              key={index}
              className="p-4 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <h3 className="font-semibold text-lg flex-1">{story.title}</h3>
                <Badge variant={story.sentiment === "bullish" ? "bullish" : story.sentiment === "bearish" ? "bearish" : "neutral"}>
                  {story.importance.toUpperCase()}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{story.summary}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{story.source}</span>
                <span>•</span>
                <span>{story.time}</span>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Technical Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.values(MOCK_INDEX_ANALYSIS).map((analysis) => (
          <GlassCard key={analysis.symbol} className="p-6">
            <h3 className="text-xl font-bold mb-4">
              {MOCK_INDEXES.find((i) => i.symbol === analysis.symbol)?.name} Analysis
            </h3>
            
            <div className="space-y-4">
              {/* Trend */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Trend</span>
                <Badge variant={analysis.trend === "bullish" ? "bullish" : analysis.trend === "bearish" ? "bearish" : "neutral"}>
                  {analysis.trend.toUpperCase()}
                </Badge>
              </div>

              {/* Support/Resistance */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">Support Levels</p>
                <div className="flex gap-2">
                  {analysis.support.map((level, i) => (
                    <div key={i} className="px-3 py-1 rounded bg-green-500/20 text-green-400 text-sm font-semibold">
                      {formatPrice(level)}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Resistance Levels</p>
                <div className="flex gap-2">
                  {analysis.resistance.map((level, i) => (
                    <div key={i} className="px-3 py-1 rounded bg-red-500/20 text-red-400 text-sm font-semibold">
                      {formatPrice(level)}
                    </div>
                  ))}
                </div>
              </div>

              {/* MACD & RSI */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">MACD</p>
                  <p className="text-xl font-bold">{analysis.macd.value.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">Signal: {analysis.macd.signal.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">RSI</p>
                  <p className="text-xl font-bold">{analysis.rsi.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">
                    {analysis.rsi > 70 ? "Overbought" : analysis.rsi < 30 ? "Oversold" : "Neutral"}
                  </p>
                </div>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* AI Market Prediction */}
      <GlassCard className="p-6 border-2 border-primary/30">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-lg bg-primary/20">
            <Brain className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">AI Market Prediction</h2>
            <p className="text-sm text-muted-foreground">Based on multiple data sources and indicators</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Direction</p>
            <Badge variant={MOCK_MARKET_PREDICTION.direction === "bullish" ? "bullish" : "bearish"} className="text-lg px-4 py-2">
              {MOCK_MARKET_PREDICTION.direction.toUpperCase()}
            </Badge>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Confidence</p>
            <p className="text-3xl font-bold text-primary">{MOCK_MARKET_PREDICTION.confidence}%</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Timeframe</p>
            <p className="text-lg font-semibold">{MOCK_MARKET_PREDICTION.timeframe}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold mb-3 text-green-400">Key Supporting Factors</h4>
            <ul className="space-y-2">
              {MOCK_MARKET_PREDICTION.keyFactors.map((factor, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <span className="text-green-400">✓</span>
                  <span>{factor}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-red-400">Risk Factors</h4>
            <ul className="space-y-2">
              {MOCK_MARKET_PREDICTION.risks.map((risk, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <span className="text-red-400">⚠</span>
                  <span>{risk}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-border">
          <h4 className="font-semibold mb-3">Price Targets</h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 rounded-lg bg-card text-center">
              <p className="text-xs text-muted-foreground mb-1">NASDAQ</p>
              <p className="text-xl font-bold text-primary">{formatPrice(MOCK_MARKET_PREDICTION.targets.nasdaq)}</p>
            </div>
            <div className="p-3 rounded-lg bg-card text-center">
              <p className="text-xs text-muted-foreground mb-1">S&P 500</p>
              <p className="text-xl font-bold text-primary">{formatPrice(MOCK_MARKET_PREDICTION.targets.sp500)}</p>
            </div>
            <div className="p-3 rounded-lg bg-card text-center">
              <p className="text-xs text-muted-foreground mb-1">DOW</p>
              <p className="text-xl font-bold text-primary">{formatPrice(MOCK_MARKET_PREDICTION.targets.dow)}</p>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* CTA to Stock Analyzer */}
      <div className="text-center py-8">
        <Link href="/analyzer">
          <Button size="lg" variant="glow" className="gap-2">
            <Brain className="h-5 w-5" />
            Analyze Individual Stocks with AI
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppShell
        topBarContent={
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm font-semibold hover:text-primary transition-colors">
              Market
            </Link>
            <Link href="/analyzer" className="text-sm font-semibold hover:text-primary transition-colors">
              Stock Analyzer
            </Link>
          </div>
        }
        sidebarContent={null}
        alertCount={0}
        userEmail="user@example.com"
      >
        <MarketOverview />
      </AppShell>
    </QueryClientProvider>
  );
}
