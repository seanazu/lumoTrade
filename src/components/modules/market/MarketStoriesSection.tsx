"use client";

import { type FC } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { GlassCard } from "@/components/design-system/organisms/GlassCard";
import { Badge } from "@/components/design-system/atoms/Badge";
import { MarketStory } from "@/resources/mock-data/indexes";

interface MarketStoriesSectionProps {
  stories: MarketStory[];
}

export const MarketStoriesSection: FC<MarketStoriesSectionProps> = ({
  stories,
}) => {
  return (
    <GlassCard className="p-6">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Sparkles className="h-6 w-6" />
        Top Market Stories
      </h2>
      <div className="space-y-4">
        {stories.map((story, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.01, x: 4 }}
            className="p-4 rounded-lg bg-card border border-border hover:border-primary/50 transition-all duration-200 cursor-pointer"
          >
            <div className="flex items-start justify-between gap-4 mb-2">
              <h3 className="font-semibold text-lg flex-1">{story.title}</h3>
              <Badge
                variant={
                  story.sentiment === "bullish"
                    ? "bullish"
                    : story.sentiment === "bearish"
                    ? "bearish"
                    : "neutral"
                }
              >
                {story.importance.toUpperCase()}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{story.summary}</p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>{story.source}</span>
              <span>•</span>
              <span>{story.time}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </GlassCard>
  );
};

