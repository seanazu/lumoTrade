"use client";

import { useState, type FC } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Sparkles } from "lucide-react";
import { AIChatPanel } from "@/components/modules/ai-chat/AIChatPanel";

export const AIChatToggle: FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(true)}
        className="relative p-2 rounded-lg hover:bg-primary/10 transition-colors group"
        aria-label="Open AI Chat"
        data-onboarding="ai-chat"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <motion.div
          animate={{
            rotate: [0, 10, 0, -10, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <MessageSquare className="h-5 w-5" />
        </motion.div>
        <motion.div
          className="absolute -top-1 -right-1"
          animate={{
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
          }}
        >
          <Sparkles className="h-3 w-3 text-primary" />
        </motion.div>
      </motion.button>

      <AIChatPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

