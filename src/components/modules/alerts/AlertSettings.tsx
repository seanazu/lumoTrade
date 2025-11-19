"use client";

import { useState, useEffect, type FC } from "react";
import { motion } from "framer-motion";
import { Bell, BellOff, Plus, Trash2 } from "lucide-react";
import { GlassCard } from "@/components/design-system/organisms/GlassCard";
import { Button } from "@/components/design-system/atoms/Button";
import { Input } from "@/components/design-system/atoms/Input";
import { Toggle } from "@/components/design-system/atoms/Toggle";
import { notificationService } from "@/lib/notifications/notification-service";

interface Alert {
  id: string;
  symbol: string;
  type: 'price' | 'volume';
  condition?: 'above' | 'below';
  value: number;
  enabled: boolean;
}

export const AlertSettings: FC = () => {
  const [hasPermission, setHasPermission] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [newAlert, setNewAlert] = useState({
    symbol: '',
    type: 'price' as 'price' | 'volume',
    condition: 'above' as 'above' | 'below',
    value: 0,
  });

  useEffect(() => {
    setHasPermission(notificationService.getPermission() === 'granted');
  }, []);

  const requestPermission = async () => {
    const granted = await notificationService.requestPermission();
    setHasPermission(granted);
    if (granted) {
      await notificationService.show({
        title: 'Notifications Enabled! 🎉',
        body: "You'll receive alerts for price movements and important events",
      });
    }
  };

  const addAlert = () => {
    if (!newAlert.symbol || !newAlert.value) return;

    const alert: Alert = {
      id: `alert-${Date.now()}`,
      ...newAlert,
      enabled: true,
    };

    setAlerts([...alerts, alert]);
    setNewAlert({ symbol: '', type: 'price', condition: 'above', value: 0 });
  };

  const removeAlert = (id: string) => {
    setAlerts(alerts.filter((a) => a.id !== id));
  };

  const toggleAlert = (id: string) => {
    setAlerts(
      alerts.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a))
    );
  };

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold mb-1">Alert Settings</h2>
          <p className="text-sm text-muted-foreground">
            Get notified about important price movements
          </p>
        </div>
        {!hasPermission && (
          <Button onClick={requestPermission} variant="glow" className="gap-2">
            <Bell className="h-4 w-4" />
            Enable Notifications
          </Button>
        )}
      </div>

      {!hasPermission ? (
        <div className="text-center py-8">
          <BellOff className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Notifications Disabled</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Enable notifications to receive real-time alerts
          </p>
        </div>
      ) : (
        <>
          {/* Add New Alert */}
          <div className="mb-6 p-4 rounded-lg bg-secondary/50">
            <h3 className="font-semibold mb-3">Create New Alert</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Input
                placeholder="Symbol (e.g., AAPL)"
                value={newAlert.symbol}
                onChange={(e) =>
                  setNewAlert({ ...newAlert, symbol: e.target.value.toUpperCase() })
                }
              />
              <select
                className="h-10 w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm"
                value={newAlert.type}
                onChange={(e) =>
                  setNewAlert({ ...newAlert, type: e.target.value as 'price' | 'volume' })
                }
              >
                <option value="price">Price Alert</option>
                <option value="volume">Volume Alert</option>
              </select>
              {newAlert.type === 'price' && (
                <select
                  className="h-10 w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm"
                  value={newAlert.condition}
                  onChange={(e) =>
                    setNewAlert({ ...newAlert, condition: e.target.value as 'above' | 'below' })
                  }
                >
                  <option value="above">Above</option>
                  <option value="below">Below</option>
                </select>
              )}
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder={newAlert.type === 'price' ? 'Price' : 'Volume %'}
                  value={newAlert.value || ''}
                  onChange={(e) =>
                    setNewAlert({ ...newAlert, value: parseFloat(e.target.value) })
                  }
                />
                <Button onClick={addAlert} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Active Alerts */}
          <div className="space-y-3">
            <h3 className="font-semibold">Active Alerts ({alerts.length})</h3>
            {alerts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No alerts configured yet
              </div>
            ) : (
              alerts.map((alert) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-card border border-border"
                >
                  <div className="flex items-center gap-3">
                    <Toggle
                      pressed={alert.enabled}
                      onPressedChange={() => toggleAlert(alert.id)}
                    >
                      {alert.enabled ? (
                        <Bell className="h-4 w-4" />
                      ) : (
                        <BellOff className="h-4 w-4" />
                      )}
                    </Toggle>
                    <div>
                      <p className="font-semibold">
                        {alert.symbol}{' '}
                        {alert.type === 'price' && (
                          <span className="text-muted-foreground text-sm">
                            {alert.condition} ${alert.value}
                          </span>
                        )}
                        {alert.type === 'volume' && (
                          <span className="text-muted-foreground text-sm">
                            volume increase {alert.value}%
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {alert.type} alert
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeAlert(alert.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </motion.div>
              ))
            )}
          </div>
        </>
      )}
    </GlassCard>
  );
};

