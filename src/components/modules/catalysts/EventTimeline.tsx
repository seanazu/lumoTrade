"use client";

import { type FC } from "react";
import { motion } from "framer-motion";
import { EventNode } from "@/components/design-system/molecules/EventNode";
import { Catalyst } from "@/resources/mock-data/catalysts";
import { staggerChildren, fadeInScale } from "@/utils/animations/variants";

interface EventTimelineProps {
  catalysts: Catalyst[];
}

const EventTimeline: FC<EventTimelineProps> = ({ catalysts }) => {
  return (
    <div className="relative">
      {/* Timeline Line */}
      <div className="absolute top-5 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-accent-cyan/30 to-transparent" />

      {/* Events */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerChildren}
        className="flex gap-8 overflow-x-auto pb-4 px-4"
      >
        {catalysts.map((catalyst, index) => (
          <motion.div key={index} variants={fadeInScale}>
            <EventNode
              type={catalyst.type}
              label={catalyst.label}
              date={catalyst.date}
              description={catalyst.description}
              isToday={index === 0} // Mock: first event is "today"
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export { EventTimeline };

