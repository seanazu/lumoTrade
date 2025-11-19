"use client";
import { QueryClientProvider } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Trophy, TrendingUp, Award, Calendar } from "lucide-react";
import { queryClient } from "@/lib/tanstack-query/queryClient";
import { AppShell } from "@/components/design-system/organisms/AppShell";
import { GlassCard } from "@/components/design-system/organisms/GlassCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/design-system/atoms/Avatar";
import { Badge } from "@/components/design-system/atoms/Badge";

const MOCK_LEADERBOARD = [
  {
    rank: 1,
    name: "Sarah Chen",
    avatar: "",
    winRate: 78,
    totalReturn: 42500,
    trades: 247,
    verified: true,
  },
  {
    rank: 2,
    name: "Mike Johnson",
    avatar: "",
    winRate: 72,
    totalReturn: 38200,
    trades: 189,
    verified: true,
  },
  {
    rank: 3,
    name: "Alex Rivera",
    avatar: "",
    winRate: 69,
    totalReturn: 35100,
    trades: 215,
    verified: false,
  },
  {
    rank: 4,
    name: "Emma Davis",
    avatar: "",
    winRate: 68,
    totalReturn: 31400,
    trades: 198,
    verified: true,
  },
  {
    rank: 5,
    name: "John Trader",
    avatar: "",
    winRate: 66,
    totalReturn: 28900,
    trades: 201,
    verified: false,
  },
];

const ACTIVE_CONTESTS = [
  {
    id: "1",
    name: "November Trading Challenge",
    prize: "$5,000",
    participants: 1247,
    endsIn: "15 days",
    category: "Monthly",
  },
  {
    id: "2",
    name: "Day Trading Sprint",
    prize: "$1,000",
    participants: 584,
    endsIn: "3 days",
    category: "Weekly",
  },
];

function LeaderboardPage() {
  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold mb-2">Leaderboard & Contests</h1>
        <p className="text-muted-foreground">
          Compete with the best traders and win prizes
        </p>
      </motion.div>

      {/* Active Contests */}
      <div>
        <h2 className="text-xl font-bold mb-4">Active Contests</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {ACTIVE_CONTESTS.map((contest, idx) => (
            <motion.div
              key={contest.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <GlassCard className="p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <Badge variant="violet" className="mb-2">
                      {contest.category}
                    </Badge>
                    <h3 className="text-xl font-bold">{contest.name}</h3>
                  </div>
                  <Trophy className="h-8 w-8 text-yellow-500" />
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Prize Pool:</span>
                    <span className="font-bold text-green-500">{contest.prize}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Participants:</span>
                    <span className="font-semibold">{contest.participants}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Ends in:</span>
                    <span className="font-semibold text-orange-500">
                      {contest.endsIn}
                    </span>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Leaderboard */}
      <GlassCard className="p-6">
        <h2 className="text-xl font-bold mb-6">Top Traders This Month</h2>
        <div className="space-y-2">
          {MOCK_LEADERBOARD.map((trader, idx) => (
            <motion.div
              key={trader.rank}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="flex items-center gap-4 p-4 rounded-lg hover:bg-secondary/50 transition-colors"
            >
              {/* Rank */}
              <div className="w-12 text-center">
                {trader.rank <= 3 ? (
                  <Trophy
                    className={`h-8 w-8 mx-auto ${
                      trader.rank === 1
                        ? "text-yellow-500"
                        : trader.rank === 2
                        ? "text-gray-400"
                        : "text-orange-600"
                    }`}
                  />
                ) : (
                  <span className="text-2xl font-bold text-muted-foreground">
                    #{trader.rank}
                  </span>
                )}
              </div>

              {/* Avatar & Name */}
              <div className="flex items-center gap-3 flex-1">
                <Avatar className="h-12 w-12">
                  <AvatarFallback>{trader.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{trader.name}</span>
                    {trader.verified && (
                      <Badge variant="default" className="text-xs">
                        Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {trader.trades} trades
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="hidden md:flex items-center gap-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Win Rate</p>
                  <p className="text-lg font-bold">{trader.winRate}%</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Total P&L</p>
                  <p className="text-lg font-bold text-green-500">
                    +${trader.totalReturn.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Badge */}
              {trader.rank <= 3 && (
                <Award className="h-6 w-6 text-primary" />
              )}
            </motion.div>
          ))}
        </div>
      </GlassCard>

      {/* Contest Rules */}
      <GlassCard className="p-6">
        <h2 className="text-xl font-bold mb-4">How Contests Work</h2>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>• Compete against other traders in paper trading challenges</p>
          <p>• Winners are determined by highest returns with minimum 10 trades</p>
          <p>• All trades are tracked and verified automatically</p>
          <p>• Prizes are awarded at the end of each contest period</p>
          <p>• Fair play rules apply - suspicious activity is investigated</p>
        </div>
      </GlassCard>
    </div>
  );
}

export default function Leaderboard() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppShell
        topBarContent={null}
        sidebarContent={null}
        alertCount={0}
        userEmail="user@example.com"
      >
        <LeaderboardPage />
      </AppShell>
    </QueryClientProvider>
  );
}

