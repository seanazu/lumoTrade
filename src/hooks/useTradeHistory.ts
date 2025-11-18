import { db } from '@/lib/instant';
import { useAuth } from './useAuth';
import { id } from '@instantdb/react';

type TradeType = 'entry' | 'exit' | 'note';

/**
 * Custom hook for trade history operations with InstantDB
 */
export function useTradeHistory(ticker?: string) {
  const { user } = useAuth();

  // Build query based on whether ticker is provided
  const query = user
    ? {
        tradeHistory: {
          $: {
            where: ticker
              ? {
                  userId: user.id,
                  ticker: ticker.toUpperCase(),
                }
              : {
                  userId: user.id,
                },
            order: {
              serverCreatedAt: 'desc' as const,
            },
          },
        },
      }
    : null;

  const { data, isLoading, error } = db.useQuery(query);

  const history = data?.tradeHistory || [];

  const addTradeEntry = async (
    ticker: string,
    type: TradeType,
    price: number,
    setup?: string,
    outcome?: string
  ) => {
    if (!user) throw new Error('User must be authenticated');

    await db.transact([
      db.tx.tradeHistory[id()].update({
        userId: user.id,
        ticker: ticker.toUpperCase(),
        type,
        price,
        timestamp: Date.now(),
        setup: setup || '',
        outcome: outcome || '',
      }),
    ]);
  };

  const deleteTradeEntry = async (entryId: string) => {
    await db.transact([db.tx.tradeHistory[entryId].delete()]);
  };

  return {
    history,
    isLoading,
    error,
    addTradeEntry,
    deleteTradeEntry,
  };
}

