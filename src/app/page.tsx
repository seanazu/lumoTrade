"use client";

import Link from "next/link";
import { QueryClientProvider } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Brain, Loader2, AlertCircle } from "lucide-react";
import { queryClient } from "@/lib/tanstack-query/queryClient";
import { AppShell } from "@/components/design-system/organisms/AppShell";
import { Button } from "@/components/design-system/atoms/Button";
import { IndexCard } from "@/components/modules/market/IndexCard";
import { IndexChartsSection } from "@/components/modules/market/IndexChartsSection";
import { MarketStoriesSection } from "@/components/modules/market/MarketStoriesSection";
import { TechnicalAnalysisSection } from "@/components/modules/market/TechnicalAnalysisSection";
import { LivePredictionSection } from "@/components/modules/prediction/LivePredictionSection";
import { MOCK_INDEX_ANALYSIS } from "@/resources/mock-data/indexes";
import { fadeInScale, staggerChildren } from "@/utils/animations/variants";
import { useMarketIndexes } from "@/hooks/useMarketIndexes";
import { useMarketNews } from "@/hooks/useMarketNews";

function MarketOverview() {
  // Fetch real-time market data
  const {
    data: indexes,
    isLoading: indexesLoading,
    error: indexesError,
  } = useMarketIndexes();

  const {
    data: stories,
    isLoading: newsLoading,
    error: newsError,
  } = useMarketNews(3);

  // No mock data fallbacks - show errors if APIs fail
  const displayIndexes = indexes || [];
  const displayStories = stories || [];

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Hero Section */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeInScale}
        className="text-center py-8"
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <h1 className="text-4xl md:text-5xl font-bold">
            Market Intelligence Dashboard
          </h1>
          {indexesLoading && (
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          )}
        </div>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Real-time market analysis powered by AI. Track indexes, predictions,
          and top stories in one place.
        </p>

        {/* Data Source Indicator */}
        {indexes && !indexesError && (
          <p className="text-xs text-muted-foreground mt-2">
            📡 Live data connected • Auto-refreshing
          </p>
        )}
      </motion.div>

      {/* Index Cards Grid */}
      {indexesError && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col gap-3 p-6 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span className="font-semibold">
              Failed to fetch market index data
            </span>
          </div>
          <span className="text-sm">
            {indexesError instanceof Error
              ? indexesError.message
              : "Check your API configuration and restart the server."}
          </span>
        </motion.div>
      )}

      {!indexesError && !indexesLoading && displayIndexes.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col gap-3 p-6 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span className="font-semibold">No market data available</span>
          </div>
          <span className="text-sm">
            FMP API is not configured. Add your FMP_API_KEY to .env.local and
            restart the server.
          </span>
        </motion.div>
      )}

      {!indexesError && displayIndexes.length > 0 && (
        <>
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerChildren}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {displayIndexes.map((index) => (
              <IndexCard key={index.symbol} index={index} />
            ))}
          </motion.div>

          {/* Index Charts */}
          <IndexChartsSection indexes={displayIndexes} />
        </>
      )}

      {/* AI Prediction Section */}
      <LivePredictionSection />

      {/* Top Market Stories */}
      {newsError && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col gap-3 p-6 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span className="font-semibold">Failed to fetch market news</span>
          </div>
          <span className="text-sm">
            {newsError instanceof Error
              ? newsError.message
              : "Check your API configuration and restart the server."}
          </span>
        </motion.div>
      )}

      {!newsError && !newsLoading && displayStories.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col gap-3 p-6 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span className="font-semibold">No market news available</span>
          </div>
          <span className="text-sm">
            Marketaux API is not configured. Add your MARKETAUX_API_KEY to
            .env.local and restart the server.
          </span>
        </motion.div>
      )}

      {!newsError && newsLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center p-12"
        >
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">
            Loading market news...
          </span>
        </motion.div>
      )}

      {!newsError && !newsLoading && displayStories.length > 0 && (
        <MarketStoriesSection stories={displayStories} />
      )}

      {/* Technical Analysis */}
      {!indexesError && displayIndexes.length > 0 && (
        <TechnicalAnalysisSection
          indexes={displayIndexes}
          analysis={MOCK_INDEX_ANALYSIS}
        />
      )}

      {/* CTA to Stock Analyzer */}
      <motion.div
        className="text-center py-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Link href="/analyzer">
          <Button size="lg" variant="glow" className="gap-2 group">
            <Brain className="h-5 w-5 group-hover:rotate-12 transition-transform duration-200" />
            Analyze Individual Stocks with AI
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}

export default function Home() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppShell
        topBarContent={
          <motion.nav
            className="flex items-center gap-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Link
              href="/"
              className="text-sm font-semibold text-primary border-b-2 border-primary pb-0.5"
            >
              Market
            </Link>
            <Link
              href="/analyzer"
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors group"
              data-onboarding="analyzer-link"
            >
              <Brain className="h-4 w-4 group-hover:rotate-12 transition-transform duration-200" />
              Stock Analyzer
            </Link>
          </motion.nav>
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
