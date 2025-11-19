"use client";

import { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageSquare, Sparkles } from "lucide-react";
import { useChat } from "@ai-sdk/react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { Button } from "@/components/design-system/atoms/Button";

export interface AIChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIChatPanel: React.FC<AIChatPanelProps> = ({ isOpen, onClose }) => {
  const { messages, input, handleInputChange, handleSubmit, isLoading, setInput } =
    useChat({
      api: "/api/chat",
    });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (message: string) => {
    setInput(message);
    // Trigger form submission
    const form = new Event("submit", { bubbles: true, cancelable: true });
    handleSubmit(form as any);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50 lg:hidden"
          />

          {/* Chat Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-96 bg-background border-l border-border shadow-xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-primary/5">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-bold">AI Assistant</h2>
                  <p className="text-xs text-muted-foreground">
                    Ask about stocks & markets
                  </p>
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={onClose}
                className="flex-shrink-0"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                  <motion.div
                    animate={{
                      rotate: [0, 15, 0, -15, 0],
                      scale: [1, 1.1, 1, 1.1, 1],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <MessageSquare className="h-16 w-16 text-primary mb-4" />
                  </motion.div>
                  <h3 className="text-lg font-semibold mb-2">
                    Your AI Trading Assistant
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Get instant analysis, find opportunities, and understand market
                    trends
                  </p>
                  <div className="space-y-2 text-left w-full max-w-xs">
                    <p className="text-xs text-muted-foreground">Try asking:</p>
                    <ul className="text-xs space-y-1 text-muted-foreground">
                      <li>• "Why is AAPL dropping today?"</li>
                      <li>• "Find growth stocks under $50"</li>
                      <li>• "Explain this MACD signal"</li>
                      <li>• "What's the market sentiment?"</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="py-4">
                  {messages.map((message) => (
                    <ChatMessage
                      key={message.id}
                      role={message.role as "user" | "assistant"}
                      content={message.content}
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input */}
            <ChatInput onSend={handleSend} isLoading={isLoading} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

