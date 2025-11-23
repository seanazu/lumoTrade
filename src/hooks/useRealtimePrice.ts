/**
 * Real-time Price Hook
 * Subscribes to live price updates via WebSocket
 */

import { useState, useEffect, useRef } from 'react';
import { polygonWSClient } from '@/lib/api/websocket/polygon-ws-client';

interface RealtimePrice {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  timestamp: number;
}

interface PriceUpdate {
  sym?: string;
  p?: number;
  t?: number;
  ev?: string;
  [key: string]: unknown;
}

/**
 * Hook to subscribe to real-time price updates for symbols
 * 
 * @param symbols - Array of symbols to track
 * @param enabled - Whether to enable real-time updates
 * @returns Map of symbol to current price data
 */
export function useRealtimePrice(
  symbols: string[],
  enabled: boolean = true
) {
  const [prices, setPrices] = useState<Map<string, RealtimePrice>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const initialPricesRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    if (!enabled || symbols.length === 0) {
      return;
    }

    // Store cleanup functions
    const cleanups: (() => void)[] = [];

    // Handle connection state
    const handleConnect = () => {
      setIsConnected(true);
      console.log('Real-time price feed connected');
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      console.log('Real-time price feed disconnected');
    };

    // Handle incoming price updates
    const handleMessage = (data: unknown) => {
      const update = data as PriceUpdate;
      
      // Handle trade events (T) and aggregate events (A)
      if ((update.ev === 'T' || update.ev === 'A') && update.sym && update.p) {
        const symbol = update.sym;
        const currentPrice = update.p;
        const timestamp = update.t || Date.now();

        // Get initial price if not set
        if (!initialPricesRef.current.has(symbol)) {
          initialPricesRef.current.set(symbol, currentPrice);
        }

        const initialPrice = initialPricesRef.current.get(symbol) || currentPrice;
        const change = currentPrice - initialPrice;
        const changePercent = (change / initialPrice) * 100;

        setPrices((prev) => {
          const newPrices = new Map(prev);
          newPrices.set(symbol, {
            symbol,
            price: currentPrice,
            change,
            changePercent,
            timestamp,
          });
          return newPrices;
        });
      }
    };

    // Register handlers
    cleanups.push(polygonWSClient.onConnect(handleConnect));
    cleanups.push(polygonWSClient.onDisconnect(handleDisconnect));
    cleanups.push(polygonWSClient.onMessage(handleMessage));

    // Subscribe to symbols
    if (polygonWSClient.isConnected()) {
      polygonWSClient.subscribe(symbols);
    } else {
      // If not connected, wait for connection then subscribe
      const unsubscribe = polygonWSClient.onConnect(() => {
        polygonWSClient.subscribe(symbols);
      });
      cleanups.push(unsubscribe);
    }

    // Cleanup on unmount
    return () => {
      polygonWSClient.unsubscribe(symbols);
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [symbols, enabled]);

  return {
    prices,
    isConnected,
    isConfigured: polygonWSClient.isConfigured(),
  };
}

/**
 * Hook to subscribe to real-time price for a single symbol
 * 
 * @param symbol - Symbol to track
 * @param enabled - Whether to enable real-time updates
 * @returns Current price data for the symbol
 */
export function useRealtimePriceSingle(
  symbol: string,
  enabled: boolean = true
) {
  const { prices, isConnected, isConfigured } = useRealtimePrice(
    symbol ? [symbol] : [],
    enabled
  );

  return {
    price: prices.get(symbol) || null,
    isConnected,
    isConfigured,
  };
}

