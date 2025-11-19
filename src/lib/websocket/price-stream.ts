interface PriceUpdate {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  timestamp: number;
}

type PriceUpdateCallback = (update: PriceUpdate) => void;

class PriceStreamManager {
  private subscribers: Map<string, Set<PriceUpdateCallback>> = new Map();
  private mockInterval: NodeJS.Timeout | null = null;

  // Subscribe to price updates for a specific symbol
  subscribe(symbol: string, callback: PriceUpdateCallback) {
    if (!this.subscribers.has(symbol)) {
      this.subscribers.set(symbol, new Set());
    }
    this.subscribers.get(symbol)!.add(callback);

    // Start mock stream if not already running
    if (!this.mockInterval) {
      this.startMockStream();
    }
  }

  // Unsubscribe from price updates
  unsubscribe(symbol: string, callback: PriceUpdateCallback) {
    const callbacks = this.subscribers.get(symbol);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.subscribers.delete(symbol);
      }
    }

    // Stop mock stream if no more subscribers
    if (this.subscribers.size === 0 && this.mockInterval) {
      clearInterval(this.mockInterval);
      this.mockInterval = null;
    }
  }

  // Emit price update to all subscribers of a symbol
  private emit(symbol: string, update: PriceUpdate) {
    const callbacks = this.subscribers.get(symbol);
    if (callbacks) {
      callbacks.forEach((callback) => callback(update));
    }
  }

  // Mock price stream (simulates real-time data)
  // In production, replace this with actual WebSocket connection to Finnhub/Polygon/etc.
  private startMockStream() {
    const basePrices = {
      AAPL: 178.25,
      TSLA: 242.84,
      NVDA: 495.22,
      MSFT: 420.50,
      GOOGL: 140.75,
      AMZN: 175.30,
      META: 485.60,
      NFLX: 595.40,
    };

    this.mockInterval = setInterval(() => {
      this.subscribers.forEach((_, symbol) => {
        const basePrice = basePrices[symbol as keyof typeof basePrices] || 100;
        // Random price change between -0.5% and +0.5%
        const changePercent = (Math.random() - 0.5) * 1;
        const change = basePrice * (changePercent / 100);
        const newPrice = basePrice + change;

        const update: PriceUpdate = {
          symbol,
          price: parseFloat(newPrice.toFixed(2)),
          change: parseFloat(change.toFixed(2)),
          changePercent: parseFloat(changePercent.toFixed(2)),
          volume: Math.floor(Math.random() * 1000000) + 500000,
          timestamp: Date.now(),
        };

        this.emit(symbol, update);

        // Update base price for next iteration
        basePrices[symbol as keyof typeof basePrices] = newPrice;
      });
    }, 3000); // Update every 3 seconds
  }

  // For production: Connect to real WebSocket API
  connectRealStream(apiKey: string) {
    // Example: Finnhub WebSocket
    // const socket = new WebSocket(`wss://ws.finnhub.io?token=${apiKey}`);
    // socket.addEventListener('message', (event) => {
    //   const data = JSON.parse(event.data);
    //   if (data.type === 'trade') {
    //     data.data.forEach((trade: any) => {
    //       this.emit(trade.s, {
    //         symbol: trade.s,
    //         price: trade.p,
    //         volume: trade.v,
    //         timestamp: trade.t,
    //       });
    //     });
    //   }
    // });
  }
}

export const priceStream = new PriceStreamManager();

