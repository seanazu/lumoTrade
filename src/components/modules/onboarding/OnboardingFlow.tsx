"use client";

import { useEffect, type FC } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { useUserStore } from "@/lib/zustand/userStore";

export const OnboardingFlow: FC = () => {
  const { onboardingCompleted, setOnboardingCompleted } = useUserStore();

  useEffect(() => {
    // Only show onboarding on first visit
    if (!onboardingCompleted && typeof window !== 'undefined') {
      // Small delay to ensure page is fully loaded
      const timer = setTimeout(() => {
        startOnboarding();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [onboardingCompleted]);

  const startOnboarding = () => {
    const driverObj = driver({
      showProgress: true,
      steps: [
        {
          element: 'body',
          popover: {
            title: 'Welcome to LumoTrade! 🎉',
            description: 'Your AI-powered stock intelligence platform. Let us show you around! (This tour takes 30 seconds)',
            side: 'center',
            align: 'center',
          },
        },
        {
          element: '[data-onboarding="ai-chat"]',
          popover: {
            title: 'AI Chat Assistant 🤖',
            description: 'Ask anything about stocks! "Why is AAPL dropping?" or "Find growth stocks under $50"',
            side: 'left',
            align: 'start',
          },
        },
        {
          element: '[data-onboarding="theme-toggle"]',
          popover: {
            title: 'Lemon-Fresh Light Mode 🍋',
            description: 'Toggle between our beautiful dark and light themes. Try the refreshing lemon-green light mode!',
            side: 'left',
            align: 'start',
          },
        },
        {
          element: '[data-onboarding="live-indicator"]',
          popover: {
            title: 'Live Price Updates 📊',
            description: 'Real-time price streaming for all stocks in your watchlist. No manual refreshing needed!',
            side: 'left',
            align: 'start',
          },
        },
        {
          element: '[data-onboarding="analyzer-link"]',
          popover: {
            title: 'AI Stock Analyzer 🎯',
            description: 'Get comprehensive AI analysis, trading plans, technical patterns, and catalysts for any stock',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: 'body',
          popover: {
            title: 'You\'re All Set! ✨',
            description: 'Start by adding stocks to your watchlist or asking the AI chat for recommendations. Happy trading!',
            side: 'center',
            align: 'center',
          },
        },
      ],
      onDestroyStarted: () => {
        setOnboardingCompleted(true);
        driverObj.destroy();
      },
    });

    driverObj.drive();
  };

  // Expose startOnboarding function globally for "Help" button
  useEffect(() => {
    (window as any).restartOnboarding = startOnboarding;
  }, []);

  return null;
};

