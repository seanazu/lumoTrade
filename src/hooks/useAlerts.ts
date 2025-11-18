import { db } from '@/lib/instant';
import { useAuth } from './useAuth';
import { id } from '@instantdb/react';

type AlertType = 'price' | 'catalyst' | 'custom';

/**
 * Custom hook for alerts operations with InstantDB
 */
export function useAlerts() {
  const { user } = useAuth();

  const { data, isLoading, error } = db.useQuery(
    user
      ? {
          alerts: {
            $: {
              where: {
                userId: user.id,
              },
            },
          },
        }
      : null
  );

  const alerts = data?.alerts || [];
  const activeAlerts = alerts.filter((alert) => alert.isActive);

  const createAlert = async (
    ticker: string,
    type: AlertType,
    condition: string,
    target: number
  ) => {
    if (!user) throw new Error('User must be authenticated');

    await db.transact([
      db.tx.alerts[id()].update({
        userId: user.id,
        ticker: ticker.toUpperCase(),
        type,
        condition,
        target,
        isActive: true,
        createdAt: Date.now(),
      }),
    ]);
  };

  const toggleAlert = async (alertId: string, isActive: boolean) => {
    await db.transact([
      db.tx.alerts[alertId].update({
        isActive,
      }),
    ]);
  };

  const deleteAlert = async (alertId: string) => {
    await db.transact([db.tx.alerts[alertId].delete()]);
  };

  return {
    alerts,
    activeAlerts,
    isLoading,
    error,
    createAlert,
    toggleAlert,
    deleteAlert,
  };
}

