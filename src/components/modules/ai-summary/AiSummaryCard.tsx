"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Brain, TrendingUp, AlertTriangle } from "lucide-react";
import { GlassCard } from "@/components/design-system/organisms/GlassCard";
import { GlowBorder } from "@/components/design-system/atoms/GlowBorder";
import { AIInsight } from "@/types/trade";
import { fadeInScale } from "@/utils/animations/variants";
import { smoothTransition } from "@/utils/animations/transitions";

interface AiSummaryCardProps {
  insight: AIInsight;
}

const AiSummaryCard: React.FC<AiSummaryCardProps> = ({ insight }) => {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeInScale}
      transition={smoothTransition}
    >
      <GlowBorder glowColor="cyan" className="relative overflow-hidden">
        <GlassCard gradient hover>
          {/* AI Glow Ring */}
          <div className="absolute top-4 right-4">
            <div className="relative">
              <motion.div
                className="absolute inset-0 rounded-full bg-accent-cyan opacity-30 blur-md"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <Brain className="h-6 w-6 text-accent-cyan relative z-10" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold">AI Insights</h3>
              <div className="ml-auto">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Rating:</span>
                  <span className="text-xl font-bold text-accent-cyan tabular-nums">
                    {insight.rating}/100
                  </span>
                </div>
              </div>
            </div>

            {/* TL;DR */}
            <div>
              <h4 className="text-sm font-semibold text-accent-cyan mb-2 uppercase tracking-wide">
                TL;DR
              </h4>
              <ul className="space-y-1">
                {insight.tldr.map((item, index) => (
                  <li key={index} className="text-sm flex items-start gap-2">
                    <span className="text-accent-cyan mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Drivers */}
            <div>
              <h4 className="text-sm font-semibold flex items-center gap-2 mb-2 uppercase tracking-wide">
                <TrendingUp className="h-4 w-4 text-green-400" />
                <span className="text-green-400">What's Driving It</span>
              </h4>
              <ul className="space-y-1">
                {insight.drivers.map((item, index) => (
                  <li key={index} className="text-sm flex items-start gap-2">
                    <span className="text-green-400 mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Risks */}
            <div>
              <h4 className="text-sm font-semibold flex items-center gap-2 mb-2 uppercase tracking-wide">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                <span className="text-red-400">Key Risks</span>
              </h4>
              <ul className="space-y-1">
                {insight.risks.map((item, index) => (
                  <li key={index} className="text-sm flex items-start gap-2">
                    <span className="text-red-400 mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </GlassCard>
      </GlowBorder>
    </motion.div>
  );
};

export { AiSummaryCard };

