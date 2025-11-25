"use client";

import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { AppShell } from "@/components/design-system/organisms/AppShell";
import { queryClient } from "@/lib/tanstack-query/queryClient";
import { Card } from "@/components/design-system/atoms/Card";
import { Button } from "@/components/design-system/atoms/Button";
import { useTheme } from "@/contexts/ThemeContext";
import { Save, Moon, Sun, TrendingUp, Brain, BarChart3, Bell } from "lucide-react";

function SettingsContent() {
  const { theme, setTheme } = useTheme();
  const [settings, setSettings] = useState({
    defaultIndex: "SPX",
    trainingLookbackDays: 730,
    validationSplit: 0.1,
    confidenceThreshold: 0.70,
    kellyFraction: 0.25,
    notificationsEnabled: true,
    emailNotifications: false,
    modelRefreshInterval: 24,
  });

  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    // Save to InstantDB
    try {
      const response = await fetch("http://localhost:8000/api/settings/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: "default", settings }),
      });
      
      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Configure your preferences and model parameters
          </p>
        </div>

        <div className="space-y-6 max-w-4xl">
          {/* Theme Settings */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Sun className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold text-foreground">Appearance</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Theme
                </label>
                <div className="flex gap-2">
                  <Button
                    variant={theme === "light" ? "default" : "outline"}
                    onClick={() => setTheme("light")}
                    className="flex-1"
                  >
                    <Sun className="w-4 h-4 mr-2" />
                    Light
                  </Button>
                  <Button
                    variant={theme === "dark" ? "default" : "outline"}
                    onClick={() => setTheme("dark")}
                    className="flex-1"
                  >
                    <Moon className="w-4 h-4 mr-2" />
                    Dark
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Trading Settings */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold text-foreground">Trading</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Default Index
                </label>
                <select
                  value={settings.defaultIndex}
                  onChange={(e) => setSettings({ ...settings, defaultIndex: e.target.value })}
                  className="w-full bg-secondary border border-border rounded-lg px-4 py-2 text-foreground"
                >
                  <option value="SPX">S&P 500 (SPX)</option>
                  <option value="NDX">Nasdaq 100 (NDX)</option>
                  <option value="DJI">Dow Jones (DJI)</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Model Training Settings */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Brain className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold text-foreground">Model Training</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Training Lookback Days: {settings.trainingLookbackDays}
                </label>
                <input
                  type="range"
                  min="30"
                  max="1825"
                  step="30"
                  value={settings.trainingLookbackDays}
                  onChange={(e) => setSettings({ ...settings, trainingLookbackDays: Number(e.target.value) })}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>30 days</span>
                  <span>5 years</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Validation Split: {(settings.validationSplit * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0.05"
                  max="0.30"
                  step="0.05"
                  value={settings.validationSplit}
                  onChange={(e) => setSettings({ ...settings, validationSplit: Number(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Model Refresh Interval: {settings.modelRefreshInterval} hours
                </label>
                <input
                  type="range"
                  min="1"
                  max="168"
                  step="1"
                  value={settings.modelRefreshInterval}
                  onChange={(e) => setSettings({ ...settings, modelRefreshInterval: Number(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>
          </Card>

          {/* Backtest Settings */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold text-foreground">Backtesting</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Confidence Threshold: {(settings.confidenceThreshold * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0.50"
                  max="0.95"
                  step="0.05"
                  value={settings.confidenceThreshold}
                  onChange={(e) => setSettings({ ...settings, confidenceThreshold: Number(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Kelly Fraction: {(settings.kellyFraction * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0.10"
                  max="0.50"
                  step="0.05"
                  value={settings.kellyFraction}
                  onChange={(e) => setSettings({ ...settings, kellyFraction: Number(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>
          </Card>

          {/* Notification Settings */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Bell className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold text-foreground">Notifications</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Push Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive alerts for predictions and trades</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notificationsEnabled}
                  onChange={(e) => setSettings({ ...settings, notificationsEnabled: e.target.checked })}
                  className="w-5 h-5"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive daily briefings via email</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                  className="w-5 h-5"
                />
              </div>
            </div>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => window.location.reload()}>
              Reset
            </Button>
            <Button onClick={handleSave} className="gap-2">
              <Save className="w-4 h-4" />
              {saved ? "Saved!" : "Save Settings"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppShell showGlobalSidebar={true}>
        <SettingsContent />
      </AppShell>
    </QueryClientProvider>
  );
}

