"use client";

import { useState, type FC } from "react";
import { motion } from "framer-motion";
import { Mail, MailCheck } from "lucide-react";
import { GlassCard } from "@/components/design-system/organisms/GlassCard";
import { Toggle } from "@/components/design-system/atoms/Toggle";
import { Button } from "@/components/design-system/atoms/Button";
import { Input } from "@/components/design-system/atoms/Input";

export const EmailPreferences: FC = () => {
  const [email, setEmail] = useState("user@example.com");
  const [dailyBriefing, setDailyBriefing] = useState(true);
  const [weeklyRecap, setWeeklyRecap] = useState(true);
  const [alertDigest, setAlertDigest] = useState(false);
  const [isTestingSend, setIsTestingSend] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  const handleSendTest = async () => {
    setIsTestingSend(true);
    try {
      const response = await fetch("/api/send-briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, userName: "Test User" }),
      });

      if (response.ok) {
        setSendSuccess(true);
        setTimeout(() => setSendSuccess(false), 3000);
      }
    } catch (error) {
      console.error("Failed to send test email:", error);
    } finally {
      setIsTestingSend(false);
    }
  };

  return (
    <GlassCard className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Mail className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Email Preferences</h2>
          <p className="text-sm text-muted-foreground">
            Manage your newsletter and notification preferences
          </p>
        </div>
      </div>

      {/* Email Input */}
      <div className="mb-6">
        <label className="text-sm font-semibold mb-2 block">Email Address</label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
        />
      </div>

      {/* Preferences */}
      <div className="space-y-4 mb-6">
        <div className="flex items-center justify-between p-4 rounded-lg bg-secondary">
          <div>
            <p className="font-semibold">Daily Market Briefing</p>
            <p className="text-sm text-muted-foreground">
              Morning summary with AI insights (7 AM)
            </p>
          </div>
          <Toggle pressed={dailyBriefing} onPressedChange={setDailyBriefing} />
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg bg-secondary">
          <div>
            <p className="font-semibold">Weekly Performance Recap</p>
            <p className="text-sm text-muted-foreground">
              Sunday overview of your trading week
            </p>
          </div>
          <Toggle pressed={weeklyRecap} onPressedChange={setWeeklyRecap} />
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg bg-secondary">
          <div>
            <p className="font-semibold">Alert Digest</p>
            <p className="text-sm text-muted-foreground">
              Daily summary of price alerts and patterns
            </p>
          </div>
          <Toggle pressed={alertDigest} onPressedChange={setAlertDigest} />
        </div>
      </div>

      {/* Test Send */}
      <motion.div whileTap={{ scale: 0.98 }}>
        <Button
          onClick={handleSendTest}
          disabled={isTestingSend || !email}
          className="w-full"
          variant={sendSuccess ? "outline" : "default"}
        >
          {sendSuccess ? (
            <>
              <MailCheck className="h-4 w-4 mr-2" />
              Test Email Sent!
            </>
          ) : (
            <>
              <Mail className="h-4 w-4 mr-2" />
              {isTestingSend ? "Sending..." : "Send Test Email"}
            </>
          )}
        </Button>
      </motion.div>

      <p className="text-xs text-muted-foreground text-center mt-4">
        Changes are saved automatically
      </p>
    </GlassCard>
  );
};

