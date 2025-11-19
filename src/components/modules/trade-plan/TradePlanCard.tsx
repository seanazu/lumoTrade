"use client";

import { type FC } from "react";
import { motion } from "framer-motion";
import { TradePlan } from "@/types/trade";
import { GlassCard } from "@/components/design-system/organisms/GlassCard";
import { Badge } from "@/components/design-system/atoms/Badge";
import { RiskRewardBar } from "@/components/design-system/molecules/RiskRewardBar";
import { LevelsDisplay } from "./LevelsDisplay";
import { ConfidenceMeter } from "./ConfidenceMeter";
import { slideInRight } from "@/utils/animations/variants";
import { smoothTransition } from "@/utils/animations/transitions";

interface TradePlanCardProps {
  tradePlan: TradePlan;
}

const TradePlanCard: FC<TradePlanCardProps> = ({ tradePlan }) => {
  const entryMid = (tradePlan.entry.min + tradePlan.entry.max) / 2;
  const risk = Math.abs(entryMid - tradePlan.stop);
  const reward = Math.abs(tradePlan.target[0] - entryMid);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={slideInRight}
      transition={smoothTransition}
    >
      <GlassCard className="h-full">
        <div className="space-y-6">
          {/* Setup Label */}
          <div>
            <h3 className="text-lg font-bold mb-2">Trade Setup</h3>
            <Badge variant="violet">{tradePlan.setup}</Badge>
          </div>

          {/* Levels */}
          <LevelsDisplay tradePlan={tradePlan} />

          {/* Risk/Reward */}
          <RiskRewardBar
            ratio={tradePlan.riskReward}
            risk={risk}
            reward={reward}
          />

          {/* Confidence & Timeframe */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Confidence</p>
              <ConfidenceMeter value={tradePlan.confidence} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Time Horizon</p>
              <Badge variant="outline">{tradePlan.timeHorizon}</Badge>
            </div>
          </div>

          {/* Playbook */}
          <div>
            <h4 className="text-sm font-semibold mb-3 uppercase tracking-wide">
              Playbook
            </h4>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-green-400 font-semibold mb-1">
                  Best Case
                </p>
                <p className="text-sm">{tradePlan.playbook.bestCase}</p>
              </div>
              <div>
                <p className="text-xs text-accent-cyan font-semibold mb-1">
                  Base Case
                </p>
                <p className="text-sm">{tradePlan.playbook.baseCase}</p>
              </div>
              <div>
                <p className="text-xs text-red-400 font-semibold mb-1">
                  Invalidation
                </p>
                <p className="text-sm">{tradePlan.playbook.invalidation}</p>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
};

export { TradePlanCard };

