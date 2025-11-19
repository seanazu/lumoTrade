"use client";

import { forwardRef, type ReactNode } from "react";
import { Sparkles } from "lucide-react";

interface ShareableCardProps {
  title: string;
  children: ReactNode;
  watermark?: boolean;
}

export const ShareableCard = forwardRef<HTMLDivElement, ShareableCardProps>(
  ({ title, children, watermark = true }, ref) => {
    return (
      <div
        ref={ref}
        className="bg-[#f7fff7] p-8 rounded-2xl min-w-[600px] relative border border-gray-200"
        style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
      >
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#1a535c] mb-2">{title}</h1>
          <div className="h-1 w-20 bg-gradient-to-r from-[#4ecdc4] to-[#1a535c] rounded-full" />
        </div>

        {/* Content */}
        <div className="mb-6">{children}</div>

        {/* Watermark */}
        {watermark && (
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4ecdc4] to-[#1a535c] flex items-center justify-center shadow-sm shadow-[#4ecdc4]/30">
                <span className="text-white font-bold text-sm">L</span>
              </div>
              <span className="font-bold text-[#1a535c]">LumoTrade</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Sparkles className="h-4 w-4" />
              <span>AI-Powered Stock Analysis</span>
            </div>
          </div>
        )}
      </div>
    );
  }
);

ShareableCard.displayName = "ShareableCard";

