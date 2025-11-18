"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { MetricPill } from "@/components/design-system/molecules/MetricPill";
import { MetricData } from "@/resources/mock-data/metrics";
import { staggerChildren, fadeInScale } from "@/utils/animations/variants";
import { smoothTransition } from "@/utils/animations/transitions";

interface MetricPillsRowProps {
  metrics: MetricData[];
}

const MetricPillsRow: React.FC<MetricPillsRowProps> = ({ metrics }) => {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerChildren}
      className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin"
    >
      {metrics.map((metric, index) => (
        <motion.div key={index} variants={fadeInScale} transition={smoothTransition}>
          <MetricPill
            label={metric.label}
            value={metric.value}
            change={metric.change}
            sparklineData={metric.sparkline}
          />
        </motion.div>
      ))}
    </motion.div>
  );
};

export { MetricPillsRow };

