"use client";

import Link from "next/link";
import { QueryClientProvider } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Brain, Loader2, AlertCircle, TrendingUp, Sparkles, Zap, BarChart3 } from "lucide-react";
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

  const displayIndexes = indexes || [];
  const displayStories = stories || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-blue-950/5">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-500" />
        <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="container mx-auto p-6 space-y-8">
        {/* Enhanced Hero Section */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInScale}
          className="text-center py-12 relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 rounded-3xl backdrop-blur-sm" />
          <div className="relative z-10">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Sparkles className="w-8 h-8 text-blue-400" />
              <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Market Intelligence
              </h1>
              {indexesLoading && (
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              )}
            </div>
            <p className="text-muted-foreground text-xl max-w-3xl mx-auto leading-relaxed">
              Real-time market analysis powered by AI. Track indexes, predictions,
              and top stories in one beautiful dashboard.
            </p>

            {/* Data Source Indicator */}
            {indexes && !indexesError && (
              <motion.div
                className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="w-2 h-2 bg-green-400 rounded-full" />
                <span className="text-sm text-green-400 font-medium">
                  Live data connected • Auto-refreshing
                </span>
              </motion.div>
            )}

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
              <Link href="/analyzer">
                <Button
                  size="lg"
                  className="gap-2 group bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 shadow-lg"
                >
                  <Brain className="h-5 w-5 transition-transform duration-200" />
                  AI Stock Analyzer
                </Button>
              </Link>
              <Link href="/model-monitor">
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2 group border-blue-500/50 hover:border-blue-500 hover:bg-blue-500/10"
                >
                  <BarChart3 className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                  Model Monitor
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Error Handling */}
        {indexesError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col gap-3 p-6 rounded-2xl bg-gradient-to-r from-red-500/10 to-red-500/5 border border-red-500/20 text-red-600 dark:text-red-400 backdrop-blur-sm"
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
            className="flex flex-col gap-3 p-6 rounded-2xl bg-gradient-to-r from-orange-500/10 to-orange-500/5 border border-orange-500/20 text-orange-600 dark:text-orange-400 backdrop-blur-sm"
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

        {/* Enhanced Index Cards Grid */}
        {!indexesError && displayIndexes.length > 0 && (
          <>
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerChildren}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {displayIndexes.map((index, i) => (
                <motion.div
                  key={index.symbol}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ scale: 1.02, y: -4 }}
                  className="transform transition-all"
                >
                  <IndexCard index={index} />
                </motion.div>
              ))}
            </motion.div>

            {/* Index Charts with Enhanced Container */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-3xl blur-xl" />
              <div className="relative z-10">
                <IndexChartsSection indexes={displayIndexes} />
              </div>
            </motion.div>
          </>
        )}

        {/* Enhanced AI Prediction Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 rounded-3xl blur-xl" />
          <div className="relative z-10">
            <div className="mb-6 text-center">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                AI-Powered Predictions
              </h2>
              <p className="text-muted-foreground">
                Advanced machine learning models analyze market data to forecast future movements
              </p>
            </div>
            <LivePredictionSection />
          </div>
        </motion.div>

        {/* Enhanced Top Market Stories */}
        {newsError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col gap-3 p-6 rounded-2xl bg-gradient-to-r from-red-500/10 to-red-500/5 border border-red-500/20 text-red-600 dark:text-red-400 backdrop-blur-sm"
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
            className="flex flex-col gap-3 p-6 rounded-2xl bg-gradient-to-r from-orange-500/10 to-orange-500/5 border border-orange-500/20 text-orange-600 dark:text-orange-400 backdrop-blur-sm"
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-blue-500/5 rounded-3xl blur-xl" />
            <div className="relative z-10">
              <div className="mb-6 text-center">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent mb-2">
                  Top Market Stories
                </h2>
                <p className="text-muted-foreground">
                  Stay informed with the latest market-moving news and analysis
                </p>
              </div>
              <MarketStoriesSection stories={displayStories} />
            </div>
          </motion.div>
        )}

        {/* Enhanced Technical Analysis */}
        {!indexesError && displayIndexes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-red-500/5 rounded-3xl blur-xl" />
            <div className="relative z-10">
              <div className="mb-6 text-center">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent mb-2">
                  Technical Analysis
                </h2>
                <p className="text-muted-foreground">
                  Deep dive into technical indicators and market sentiment
                </p>
              </div>
              <TechnicalAnalysisSection
                indexes={displayIndexes}
                analysis={MOCK_INDEX_ANALYSIS}
              />
            </div>
          </motion.div>
        )}

        {/* Enhanced CTA Section */}
        <motion.div
          className="text-center py-12 relative overflow-hidden rounded-3xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-sm" />
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20"
            animate={{
              x: ["-100%", "100%"],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear",
            }}
          />
          <div className="relative z-10">
            <h3 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Ready to dive deeper?
            </h3>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Analyze individual stocks with our advanced AI-powered tools and get personalized insights
            </p>
            <Link href="/analyzer">
              <Button size="lg" variant="glow" className="gap-2 group shadow-2xl shadow-blue-500/50">
                <Brain className="h-5 w-5 group-hover:rotate-12 transition-transform duration-200" />
                Analyze Individual Stocks with AI
                <TrendingUp className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
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
              className="text-sm font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent border-b-2 border-blue-500 pb-0.5"
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
            <Link
              href="/model-monitor"
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors group"
            >
              <BarChart3 className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
              Model Monitor
            </Link>
          </motion.nav>
        }
        showGlobalSidebar={true}
        alertCount={0}
        userEmail="user@example.com"
      >
        <MarketOverview />
      </AppShell>
    </QueryClientProvider>
  );
}
