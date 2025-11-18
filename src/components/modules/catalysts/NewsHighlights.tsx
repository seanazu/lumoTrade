"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { NewsCard } from "@/components/design-system/molecules/NewsCard";
import { NewsItem } from "@/resources/mock-data/news";
import { staggerChildren, fadeInScale } from "@/utils/animations/variants";

interface NewsHighlightsProps {
  news: NewsItem[];
  onNewsClick?: (index: number) => void;
}

const NewsHighlights: React.FC<NewsHighlightsProps> = ({ news, onNewsClick }) => {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerChildren}
      className="flex gap-4 overflow-x-auto pb-4 px-1"
    >
      {news.map((item, index) => (
        <motion.div key={index} variants={fadeInScale}>
          <NewsCard
            source={item.source}
            headline={item.headline}
            sentiment={item.sentiment}
            tag={item.tag}
            time={item.time}
            onClick={() => onNewsClick?.(index)}
          />
        </motion.div>
      ))}
    </motion.div>
  );
};

export { NewsHighlights };

