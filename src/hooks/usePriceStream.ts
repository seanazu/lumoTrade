import { useEffect, useState, useCallback } from 'react';
import { priceStream } from '@/lib/websocket/price-stream';

interface PriceData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  timestamp: number;
}

export function usePriceStream(symbol: string | null) {
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [priceDirection, setPriceDirection] = useState<'up' | 'down' | null>(null);

  const handlePriceUpdate = useCallback((update: PriceData) => {
    setPriceData((prev) => {
      // Determine price direction for animation
      if (prev && update.price !== prev.price) {
        setPriceDirection(update.price > prev.price ? 'up' : 'down');
        // Reset direction after animation
        setTimeout(() => setPriceDirection(null), 1000);
      }
      return update;
    });
  }, []);

  useEffect(() => {
    if (!symbol) return;

    setIsConnected(true);
    priceStream.subscribe(symbol, handlePriceUpdate);

    return () => {
      priceStream.unsubscribe(symbol, handlePriceUpdate);
      setIsConnected(false);
    };
  }, [symbol, handlePriceUpdate]);

  return {
    priceData,
    isConnected,
    priceDirection,
  };
}

// Hook for multiple symbols
export function useMultiPriceStream(symbols: string[]) {
  const [priceData, setPriceData] = useState<Map<string, PriceData>>(new Map());
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (symbols.length === 0) return;

    setIsConnected(true);
    const handleUpdate = (update: PriceData) => {
      setPriceData((prev) => new Map(prev).set(update.symbol, update));
    };

    symbols.forEach((symbol) => {
      priceStream.subscribe(symbol, handleUpdate);
    });

    return () => {
      symbols.forEach((symbol) => {
        priceStream.unsubscribe(symbol, handleUpdate);
      });
      setIsConnected(false);
    };
  }, [symbols]);

  return {
    priceData,
    isConnected,
    getPriceData: (symbol: string) => priceData.get(symbol) || null,
  };
}

