"use client";

import Link from "next/link";
import { QueryClientProvider } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Brain } from "lucide-react";
import { queryClient } from "@/lib/tanstack-query/queryClient";
import { AppShell } from "@/components/design-system/organisms/AppShell";
import { Button } from "@/components/design-system/atoms/Button";
import { IndexCard } from "@/components/modules/market/IndexCard";
import { IndexChartsSection } from "@/components/modules/market/IndexChartsSection";
import { MarketStoriesSection } from "@/components/modules/market/MarketStoriesSection";
import { TechnicalAnalysisSection } from "@/components/modules/market/TechnicalAnalysisSection";
import { AIPredictionSection } from "@/components/modules/market/AIPredictionSection";
import {
  MOCK_INDEXES,
  MOCK_INDEX_ANALYSIS,
  MOCK_MARKET_STORIES,
  MOCK_MARKET_PREDICTION,
} from "@/resources/mock-data/indexes";
import { fadeInScale, staggerChildren } from "@/utils/animations/variants";
import { OnboardingFlow } from "@/components/modules/onboarding/OnboardingFlow";

function MarketOverview() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      <OnboardingFlow />
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
          Real-time market analysis powered by AI. Track indexes, predictions,
          and top stories in one place.
        </p>
      </motion.div>

      {/* AI Market Prediction */}
      <AIPredictionSection prediction={MOCK_MARKET_PREDICTION} />

      {/* Index Cards Grid */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerChildren}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {MOCK_INDEXES.map((index) => (
          <IndexCard key={index.symbol} index={index} />
        ))}
      </motion.div>

      {/* Index Charts */}
      <IndexChartsSection indexes={MOCK_INDEXES} />

      {/* Top Market Stories */}
      <MarketStoriesSection stories={MOCK_MARKET_STORIES} />

      {/* Technical Analysis */}
      <TechnicalAnalysisSection
        indexes={MOCK_INDEXES}
        analysis={MOCK_INDEX_ANALYSIS}
      />

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
