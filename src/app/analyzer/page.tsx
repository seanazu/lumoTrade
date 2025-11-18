"use client";

import * as React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/tanstack-query/queryClient";
import { AppShell } from "@/components/design-system/organisms/AppShell";
import { TickerSearch } from "@/components/modules/ticker/TickerSearch";
import { GlassCard } from "@/components/design-system/organisms/GlassCard";
import { Badge } from "@/components/design-system/atoms/Badge";
import { Button } from "@/components/design-system/atoms/Button";
import { 
  Brain, 
  TrendingUp, 
  Target, 
  AlertTriangle, 
  Bell,
  Calendar,
  Newspaper,
  TrendingDown,
  BarChart3,
  Users
} from "lucide-react";
import { useTickerStore } from "@/lib/zustand/tickerStore";
import { useTickerData } from "@/hooks/useTickerData";
import { Skeleton } from "@/components/design-system/atoms/Skeleton";
import { ErrorState } from "@/components/design-system/organisms/ErrorState";
import { formatPrice, formatPercentage, formatLargeNumber } from "@/utils/formatting/numbers";
import { motion } from "framer-motion";
import { fadeInScale, staggerChildren } from "@/utils/animations/variants";
import Link from "next/link";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

// Generate mock technical chart data
const generateTechnicalChart = (basePrice: number) => {
  const data = [];
  let price = basePrice * 0.95;
  for (let i = 0; i < 60; i++) {
    const change = (Math.random() - 0.48) * (basePrice * 0.01);
    price = price + change;
    data.push({
      time: i,
      price: parseFloat(price.toFixed(2)),
      sma20: basePrice * (1 + (Math.random() - 0.5) * 0.02),
      sma50: basePrice * (1 - 0.02),
    });
  }
  return data;
};

function StockAnalyzer() {
  const { currentTicker, timeframe } = useTickerStore();
  const { data, isLoading, error } = useTickerData(currentTicker, timeframe);

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <ErrorState
          title="Failed to load stock data"
          message={`Could not find data for ${currentTicker}. Please try another symbol.`}
        />
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  const { ticker, aiSummary, tradePlan, catalysts, metrics, news } = data;
  const chartData = generateTechnicalChart(ticker.price);

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeInScale}
        className="flex items-start justify-between"
      >
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-bold">{ticker.symbol}</h1>
            <Badge variant={aiSummary.sentiment === "bullish" ? "bullish" : aiSummary.sentiment === "bearish" ? "bearish" : "neutral"}>
              {aiSummary.sentiment.toUpperCase()}
            </Badge>
          </div>
          <p className="text-lg text-muted-foreground">{ticker.name}</p>
          <div className="flex items-center gap-4 mt-2">
            <span className="text-3xl font-bold tabular-nums">${formatPrice(ticker.price)}</span>
            <span className={`text-lg font-semibold ${ticker.change >= 0 ? "text-green-500" : "text-red-500"}`}>
              {ticker.change >= 0 && "+"}{formatPrice(ticker.change)} ({formatPercentage(ticker.changePercent)})
            </span>
          </div>
        </div>
        <Button size="lg" className="gap-2">
          <Bell className="h-5 w-5" />
          Set Alert
        </Button>
      </motion.div>

      {/* 1. Fundamental Overview */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Fundamental Overview</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Market Cap</p>
            <p className="text-2xl font-bold">${formatLargeNumber(ticker.marketCap)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Sector</p>
            <p className="text-2xl font-bold">{ticker.sector}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Exchange</p>
            <p className="text-2xl font-bold">{ticker.exchange}</p>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
          <h3 className="font-semibold mb-3 text-primary">Summary in 5 Points</h3>
          <ul className="space-y-2">
            {aiSummary.tldr.map((point, i) => (
              <li key={i} className="text-sm flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </GlassCard>

      {/* 2. Catalyst Engine */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Calendar className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Catalyst Engine</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-lg bg-card">
            <p className="text-xs text-muted-foreground mb-1">Earnings Date</p>
            <p className="text-lg font-bold">{catalysts[0]?.date || "TBA"}</p>
          </div>
          <div className="p-4 rounded-lg bg-card">
            <p className="text-xs text-muted-foreground mb-1">Short Interest</p>
            <p className="text-lg font-bold">{ticker.shortInterest}%</p>
          </div>
          <div className="p-4 rounded-lg bg-card">
            <p className="text-xs text-muted-foreground mb-1">Sector Momentum</p>
            <Badge variant="bullish">STRONG</Badge>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-card">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">AI: What's Going On?</h3>
          </div>
          <div className="space-y-2">
            {aiSummary.drivers.map((driver, i) => (
              <p key={i} className="text-sm flex items-start gap-2">
                <TrendingUp className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>{driver}</span>
              </p>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* 3. Technical Auto-Analysis */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Technical Auto-Analysis</h2>
        </div>

        <div className="mb-6">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="time" stroke="rgba(255,255,255,0.5)" />
              <YAxis stroke="rgba(255,255,255,0.5)" domain={['dataMin - 2', 'dataMax + 2']} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(20, 20, 31, 0.95)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                }}
              />
              <Line type="monotone" dataKey="price" stroke="#6366f1" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="sma20" stroke="#f59e0b" strokeWidth={1} dot={false} strokeDasharray="5 5" />
              <Line type="monotone" dataKey="sma50" stroke="#10b981" strokeWidth={1} dot={false} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-card text-center">
            <p className="text-xs text-muted-foreground mb-1">Trend</p>
            <Badge variant="bullish">UPTREND</Badge>
          </div>
          <div className="p-4 rounded-lg bg-card text-center">
            <p className="text-xs text-muted-foreground mb-1">RSI</p>
            <p className="text-xl font-bold">62.5</p>
          </div>
          <div className="p-4 rounded-lg bg-card text-center">
            <p className="text-xs text-muted-foreground mb-1">Volume</p>
            <Badge variant="bullish">HIGH</Badge>
          </div>
          <div className="p-4 rounded-lg bg-card text-center">
            <p className="text-xs text-muted-foreground mb-1">Pattern</p>
            <p className="text-sm font-semibold">Breakout</p>
          </div>
        </div>
      </GlassCard>

      {/* 4. Auto Trading Plan */}
      {tradePlan && (
        <GlassCard className="p-6 border-2 border-primary/50">
          <div className="flex items-center gap-2 mb-6">
            <Target className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">AI Trading Plan</h2>
            <Badge variant="violet" className="ml-auto">
              Confidence: {tradePlan.confidence}%
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
              <p className="text-xs text-muted-foreground mb-1">🎯 Entry Range</p>
              <p className="text-xl font-bold">${formatPrice(tradePlan.entry.min)} - ${formatPrice(tradePlan.entry.max)}</p>
            </div>
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
              <p className="text-xs text-muted-foreground mb-1">🎯 Profit Target</p>
              <p className="text-xl font-bold text-green-400">${formatPrice(tradePlan.target[0])}</p>
            </div>
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
              <p className="text-xs text-muted-foreground mb-1">🛑 Stop Loss</p>
              <p className="text-xl font-bold text-red-400">${formatPrice(tradePlan.stop)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">⚖️ Risk-Reward Ratio</p>
              <p className="text-2xl font-bold">1:{tradePlan.riskReward.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">⏳ Timeframe</p>
              <p className="text-2xl font-bold">{tradePlan.timeHorizon}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-card">
              <p className="text-sm font-semibold mb-2">📈 Setup Explanation</p>
              <p className="text-sm">{tradePlan.playbook.baseCase}</p>
            </div>

            <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
              <p className="text-sm font-semibold mb-2 text-yellow-400">🧠 Be Careful Of</p>
              <ul className="space-y-1">
                {aiSummary.risks.map((risk, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </GlassCard>
      )}

      {/* 5. Alerts Section */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Bell className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Set Alerts</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: TrendingUp, label: "Breakout Alert", description: "Notify on price breakout" },
            { icon: BarChart3, label: "Volume Spike", description: "Unusual volume detected" },
            { icon: Calendar, label: "Upcoming Events", description: "Earnings & announcements" },
            { icon: Newspaper, label: "News Alert", description: "Important news & PRs" },
            { icon: Users, label: "Insider Trades", description: "Track insider activity" },
            { icon: TrendingDown, label: "Price Alert", description: "Custom price levels" },
          ].map((alert, i) => (
            <button
              key={i}
              className="p-4 rounded-lg bg-card hover:bg-primary/10 border border-border hover:border-primary/50 transition-all text-left"
            >
              <alert.icon className="h-6 w-6 mb-2 text-primary" />
              <p className="font-semibold mb-1">{alert.label}</p>
              <p className="text-xs text-muted-foreground">{alert.description}</p>
            </button>
          ))}
        </div>
      </GlassCard>

      {/* 6. Social / Community (Coming Soon) */}
      <GlassCard className="p-6 text-center">
        <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-2xl font-bold mb-2">Community Features</h2>
        <p className="text-muted-foreground mb-4">
          Share plans, discuss strategies, and follow top traders
        </p>
        <Badge>Coming Soon</Badge>
      </GlassCard>

      {/* Back to Market */}
      <div className="text-center py-8">
        <Link href="/">
          <Button variant="outline" size="lg">
            ← Back to Market Overview
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function AnalyzerPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppShell
        topBarContent={
          <div className="flex items-center gap-6 flex-1 max-w-4xl">
            <Link href="/" className="text-sm font-semibold hover:text-primary transition-colors">
              Market
            </Link>
            <Link href="/analyzer" className="text-sm font-semibold text-primary">
              Stock Analyzer
            </Link>
            <div className="flex-1">
              <TickerSearch />
            </div>
          </div>
        }
        sidebarContent={null}
        alertCount={0}
        userEmail="user@example.com"
      >
        <StockAnalyzer />
      </AppShell>
    </QueryClientProvider>
  );
}

