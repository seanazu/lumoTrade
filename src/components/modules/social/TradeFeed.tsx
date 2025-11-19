"use client";

import { type FC } from "react";
import { motion } from "framer-motion";
import { Heart, MessageCircle, Share2, TrendingUp, TrendingDown } from "lucide-react";
import { GlassCard } from "@/components/design-system/organisms/GlassCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/design-system/atoms/Avatar";
import { Badge } from "@/components/design-system/atoms/Badge";
import { Button } from "@/components/design-system/atoms/Button";

interface TradePost {
  id: string;
  author: {
    name: string;
    avatar?: string;
    verified?: boolean;
  };
  symbol: string;
  content: string;
  type: 'idea' | 'analysis' | 'result';
  entry?: number;
  target?: number;
  stopLoss?: number;
  result?: number;
  likes: number;
  comments: number;
  createdAt: number;
  isLiked?: boolean;
}

interface TradeFeedProps {
  posts: TradePost[];
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
}

export const TradeFeed: FC<TradeFeedProps> = ({
  posts,
  onLike,
  onComment,
  onShare,
}) => {
  return (
    <div className="space-y-4">
      {posts.map((post, idx) => (
        <motion.div
          key={post.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
        >
          <GlassCard className="p-4">
            {/* Header */}
            <div className="flex items-center gap-3 mb-3">
              <Avatar>
                <AvatarImage src={post.author.avatar} />
                <AvatarFallback>{post.author.name[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{post.author.name}</span>
                  <Badge variant="default" className="text-xs">
                    {post.symbol}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(post.createdAt).toLocaleDateString()}
                </span>
              </div>
              <Badge
                variant={
                  post.type === 'result'
                    ? post.result && post.result > 0
                      ? 'bullish'
                      : 'bearish'
                    : 'neutral'
                }
              >
                {post.type}
              </Badge>
            </div>

            {/* Content */}
            <p className="text-sm mb-3">{post.content}</p>

            {/* Trade Details */}
            {post.type !== 'analysis' && (
              <div className="grid grid-cols-3 gap-2 mb-3 p-3 rounded-lg bg-secondary/50">
                {post.entry && (
                  <div>
                    <p className="text-xs text-muted-foreground">Entry</p>
                    <p className="font-semibold">${post.entry.toFixed(2)}</p>
                  </div>
                )}
                {post.target && (
                  <div>
                    <p className="text-xs text-muted-foreground">Target</p>
                    <p className="font-semibold text-green-500">
                      ${post.target.toFixed(2)}
                    </p>
                  </div>
                )}
                {post.stopLoss && (
                  <div>
                    <p className="text-xs text-muted-foreground">Stop</p>
                    <p className="font-semibold text-red-500">
                      ${post.stopLoss.toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Result */}
            {post.result !== undefined && (
              <div
                className={`p-3 rounded-lg mb-3 ${
                  post.result > 0 ? "bg-green-500/20" : "bg-red-500/20"
                }`}
              >
                <div className="flex items-center gap-2">
                  {post.result > 0 ? (
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-500" />
                  )}
                  <span
                    className={`font-bold ${
                      post.result > 0 ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {post.result > 0 ? "+" : ""}${post.result.toFixed(2)} (
                    {post.result > 0 ? "+" : ""}
                    {((post.result / (post.entry || 1)) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-4 pt-3 border-t border-border">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2"
                onClick={() => onLike?.(post.id)}
              >
                <Heart
                  className={`h-4 w-4 ${post.isLiked ? "fill-red-500 text-red-500" : ""}`}
                />
                <span>{post.likes}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2"
                onClick={() => onComment?.(post.id)}
              >
                <MessageCircle className="h-4 w-4" />
                <span>{post.comments}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2"
                onClick={() => onShare?.(post.id)}
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </GlassCard>
        </motion.div>
      ))}
    </div>
  );
};

