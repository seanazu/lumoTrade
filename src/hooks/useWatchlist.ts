import { db } from '@/lib/instant';
import { useAuth } from './useAuth';
import { id } from '@instantdb/react';

/**
 * Custom hook for watchlist operations with InstantDB
 */
export function useWatchlist() {
  const { user } = useAuth();

  // Query watchlist for current user
  const { data, isLoading, error } = db.useQuery(
    user
      ? {
          watchlists: {
            $: {
              where: {
                userId: user.id,
              },
            },
          },
        }
      : null
  );

  const watchlist = data?.watchlists || [];

  const addToWatchlist = async (ticker: string, notes?: string) => {
    if (!user) throw new Error('User must be authenticated');

    await db.transact([
      db.tx.watchlists[id()].update({
        userId: user.id,
        ticker: ticker.toUpperCase(),
        addedAt: Date.now(),
        notes: notes || '',
      }),
    ]);
  };

  const removeFromWatchlist = async (watchlistId: string) => {
    await db.transact([db.tx.watchlists[watchlistId].delete()]);
  };

  const updateNotes = async (watchlistId: string, notes: string) => {
    await db.transact([
      db.tx.watchlists[watchlistId].update({
        notes,
      }),
    ]);
  };

  const isInWatchlist = (ticker: string) => {
    return watchlist.some((item) => item.ticker === ticker.toUpperCase());
  };

  return {
    watchlist,
    isLoading,
    error,
    addToWatchlist,
    removeFromWatchlist,
    updateNotes,
    isInWatchlist,
  };
}

