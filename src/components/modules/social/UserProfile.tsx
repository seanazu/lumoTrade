"use client";

import { type FC } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Users, Trophy, Calendar, CheckCircle } from "lucide-react";
import { GlassCard } from "@/components/design-system/organisms/GlassCard";
import { Badge } from "@/components/design-system/atoms/Badge";
import { Button } from "@/components/design-system/atoms/Button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/design-system/atoms/Avatar";

interface UserProfileProps {
  userId: string;
  displayName: string;
  bio?: string;
  avatar?: string;
  totalTrades: number;
  winRate: number;
  profitLoss: number;
  followers: number;
  following: number;
  isFollowing?: boolean;
  verified?: boolean;
  joinedAt: number;
  onFollow?: () => void;
}

export const UserProfile: FC<UserProfileProps> = ({
  displayName,
  bio,
  avatar,
  totalTrades,
  winRate,
  profitLoss,
  followers,
  following,
  isFollowing = false,
  verified = false,
  joinedAt,
  onFollow,
}) => {
  const joinDate = new Date(joinedAt).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });

  return (
    <GlassCard gradient className="p-6">
      <div className="flex items-start gap-4 mb-6">
        <Avatar className="h-20 w-20">
          <AvatarImage src={avatar} />
          <AvatarFallback className="text-2xl">
            {displayName[0]}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-bold">{displayName}</h2>
            {verified && (
              <CheckCircle className="h-5 w-5 text-primary" fill="currentColor" />
            )}
          </div>
          {bio && <p className="text-muted-foreground mb-2">{bio}</p>}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Joined {joinDate}</span>
          </div>
        </div>

        <Button onClick={onFollow} variant={isFollowing ? "outline" : "default"}>
          {isFollowing ? "Following" : "Follow"}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="p-4 rounded-lg bg-secondary text-center"
        >
          <Users className="h-5 w-5 mx-auto mb-2 text-primary" />
          <p className="text-2xl font-bold">{followers}</p>
          <p className="text-xs text-muted-foreground">Followers</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="p-4 rounded-lg bg-secondary text-center"
        >
          <Users className="h-5 w-5 mx-auto mb-2 text-primary" />
          <p className="text-2xl font-bold">{following}</p>
          <p className="text-xs text-muted-foreground">Following</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="p-4 rounded-lg bg-secondary text-center"
        >
          <Trophy className="h-5 w-5 mx-auto mb-2 text-primary" />
          <p className="text-2xl font-bold">{totalTrades}</p>
          <p className="text-xs text-muted-foreground">Trades</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className={`p-4 rounded-lg text-center ${
            winRate >= 50 ? "bg-green-500/20" : "bg-red-500/20"
          }`}
        >
          <TrendingUp
            className={`h-5 w-5 mx-auto mb-2 ${
              winRate >= 50 ? "text-green-500" : "text-red-500"
            }`}
          />
          <p className="text-2xl font-bold">{winRate}%</p>
          <p className="text-xs text-muted-foreground">Win Rate</p>
        </motion.div>
      </div>

      {/* P&L */}
      <div className="mt-4 p-4 rounded-lg bg-primary/10 border border-primary/30">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total P&L</span>
          <span
            className={`text-xl font-bold ${
              profitLoss >= 0 ? "text-green-500" : "text-red-500"
            }`}
          >
            {profitLoss >= 0 ? "+" : ""}${profitLoss.toFixed(2)}
          </span>
        </div>
      </div>
    </GlassCard>
  );
};

