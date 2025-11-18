import { useWatchlist } from './useWatchlist';

/**
 * Custom hook for notes operations
 * Notes are stored as part of watchlist items
 */
export function useNotes() {
  const { watchlist, updateNotes, isLoading, error } = useWatchlist();

  const getNotesForTicker = (ticker: string) => {
    const item = watchlist.find((w) => w.ticker === ticker.toUpperCase());
    return item?.notes || '';
  };

  const saveNotes = async (ticker: string, notes: string) => {
    const item = watchlist.find((w) => w.ticker === ticker.toUpperCase());
    if (item) {
      await updateNotes(item.id, notes);
    }
  };

  return {
    watchlist,
    isLoading,
    error,
    getNotesForTicker,
    saveNotes,
  };
}

