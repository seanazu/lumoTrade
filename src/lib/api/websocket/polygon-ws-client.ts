/**
 * Polygon WebSocket Client
 * Real-time streaming market data via WebSocket
 * Documentation: https://polygon.io/docs/stocks/ws_getting-started
 */

import { apiConfig, isPolygonConfigured } from '../config';

type MessageHandler = (data: unknown) => void;
type ErrorHandler = (error: Error) => void;
type ConnectionHandler = () => void;

interface PolygonWSMessage {
  ev: string; // Event type
  sym?: string; // Symbol
  p?: number; // Price
  s?: number; // Size
  t?: number; // Timestamp
  c?: number[]; // Conditions
  [key: string]: unknown;
}

class PolygonWebSocketClient {
  private ws: WebSocket | null = null;
  private apiKey = apiConfig.polygon.apiKey;
  private wsUrl = apiConfig.polygon.wsUrl;
  private subscriptions = new Set<string>();
  private messageHandlers: MessageHandler[] = [];
  private errorHandlers: ErrorHandler[] = [];
  private connectHandlers: ConnectionHandler[] = [];
  private disconnectHandlers: ConnectionHandler[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private isConnecting = false;
  private isAuthenticated = false;

  /**
   * Check if client is configured
   */
  isConfigured(): boolean {
    return isPolygonConfigured();
  }

  /**
   * Connect to Polygon WebSocket
   */
  async connect(): Promise<void> {
    if (!this.isConfigured()) {
      console.warn('Polygon WebSocket not configured.');
      return;
    }

    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      console.log('WebSocket already connected or connecting');
      return;
    }

    this.isConnecting = true;

    try {
      // Connect to stocks cluster
      const wsUrl = `${this.wsUrl}/stocks`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('✅ Polygon WebSocket connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;

        // Authenticate
        this.authenticate();
      };

      this.ws.onmessage = (event) => {
        try {
          const messages: PolygonWSMessage[] = JSON.parse(event.data);
          
          messages.forEach((msg) => {
            // Handle authentication response
            if (msg.ev === 'status') {
              this.handleStatusMessage(msg);
            } else {
              // Pass to all registered handlers
              this.messageHandlers.forEach((handler) => {
                try {
                  handler(msg);
                } catch (error) {
                  console.error('Error in message handler:', error);
                }
              });
            }
          });
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onerror = (event) => {
        console.error('WebSocket error:', event);
        const error = new Error('WebSocket connection error');
        this.errorHandlers.forEach((handler) => handler(error));
      };

      this.ws.onclose = () => {
        console.log('WebSocket closed');
        this.isConnecting = false;
        this.isAuthenticated = false;
        this.disconnectHandlers.forEach((handler) => handler());

        // Attempt to reconnect
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      this.isConnecting = false;
      throw error;
    }
  }

  /**
   * Authenticate with API key
   */
  private authenticate(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    const authMessage = {
      action: 'auth',
      params: this.apiKey,
    };

    this.ws.send(JSON.stringify(authMessage));
  }

  /**
   * Handle status messages from Polygon
   */
  private handleStatusMessage(msg: PolygonWSMessage): void {
    const status = msg.status as string;
    const message = msg.message as string;

    console.log(`Polygon status: ${status} - ${message}`);

    if (status === 'auth_success') {
      this.isAuthenticated = true;
      this.connectHandlers.forEach((handler) => handler());

      // Re-subscribe to any previous subscriptions
      if (this.subscriptions.size > 0) {
        this.resubscribe();
      }
    } else if (status === 'auth_failed') {
      console.error('Polygon authentication failed. Check your API key.');
      this.disconnect();
    }
  }

  /**
   * Subscribe to ticker updates
   * @param tickers - Array of ticker symbols (e.g., ['AAPL', 'GOOGL'])
   * @param types - Event types to subscribe to (default: ['T'] for trades)
   */
  subscribe(
    tickers: string[],
    types: string[] = ['T', 'Q', 'A'] // Trades, Quotes, Aggregates
  ): void {
    if (!this.isAuthenticated) {
      console.warn('WebSocket not authenticated. Queuing subscription...');
      // Queue subscriptions
      types.forEach((type) => {
        tickers.forEach((ticker) => {
          this.subscriptions.add(`${type}.${ticker}`);
        });
      });
      return;
    }

    const subscriptionKeys: string[] = [];
    
    types.forEach((type) => {
      tickers.forEach((ticker) => {
        const key = `${type}.${ticker}`;
        subscriptionKeys.push(key);
        this.subscriptions.add(key);
      });
    });

    const subscribeMessage = {
      action: 'subscribe',
      params: subscriptionKeys.join(','),
    };

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(subscribeMessage));
      console.log(`📡 Subscribed to: ${subscriptionKeys.join(', ')}`);
    }
  }

  /**
   * Unsubscribe from ticker updates
   */
  unsubscribe(tickers: string[], types: string[] = ['T', 'Q', 'A']): void {
    const unsubscribeKeys: string[] = [];
    
    types.forEach((type) => {
      tickers.forEach((ticker) => {
        const key = `${type}.${ticker}`;
        unsubscribeKeys.push(key);
        this.subscriptions.delete(key);
      });
    });

    const unsubscribeMessage = {
      action: 'unsubscribe',
      params: unsubscribeKeys.join(','),
    };

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(unsubscribeMessage));
      console.log(`Unsubscribed from: ${unsubscribeKeys.join(', ')}`);
    }
  }

  /**
   * Re-subscribe to all previous subscriptions
   */
  private resubscribe(): void {
    if (this.subscriptions.size === 0) {
      return;
    }

    const subscribeMessage = {
      action: 'subscribe',
      params: Array.from(this.subscriptions).join(','),
    };

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(subscribeMessage));
      console.log('📡 Re-subscribed to previous tickers');
    }
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(
      `Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`
    );

    setTimeout(() => {
      this.connect();
    }, this.reconnectDelay);

    // Exponential backoff
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000);
  }

  /**
   * Register a message handler
   */
  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.push(handler);
    
    // Return unsubscribe function
    return () => {
      const index = this.messageHandlers.indexOf(handler);
      if (index > -1) {
        this.messageHandlers.splice(index, 1);
      }
    };
  }

  /**
   * Register an error handler
   */
  onError(handler: ErrorHandler): () => void {
    this.errorHandlers.push(handler);
    
    return () => {
      const index = this.errorHandlers.indexOf(handler);
      if (index > -1) {
        this.errorHandlers.splice(index, 1);
      }
    };
  }

  /**
   * Register a connect handler
   */
  onConnect(handler: ConnectionHandler): () => void {
    this.connectHandlers.push(handler);
    
    return () => {
      const index = this.connectHandlers.indexOf(handler);
      if (index > -1) {
        this.connectHandlers.splice(index, 1);
      }
    };
  }

  /**
   * Register a disconnect handler
   */
  onDisconnect(handler: ConnectionHandler): () => void {
    this.disconnectHandlers.push(handler);
    
    return () => {
      const index = this.disconnectHandlers.indexOf(handler);
      if (index > -1) {
        this.disconnectHandlers.splice(index, 1);
      }
    };
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isAuthenticated = false;
    this.isConnecting = false;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN && this.isAuthenticated;
  }

  /**
   * Get connection state
   */
  getState(): string {
    if (!this.ws) return 'disconnected';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return this.isAuthenticated ? 'connected' : 'authenticating';
      case WebSocket.CLOSING:
        return 'closing';
      case WebSocket.CLOSED:
        return 'closed';
      default:
        return 'unknown';
    }
  }
}

// Singleton instance
export const polygonWSClient = new PolygonWebSocketClient();

// Auto-connect on browser environment
if (typeof window !== 'undefined') {
  // Connect after a short delay to ensure app is ready
  setTimeout(() => {
    if (polygonWSClient.isConfigured()) {
      polygonWSClient.connect().catch((error) => {
        console.error('Failed to auto-connect Polygon WebSocket:', error);
      });
    }
  }, 2000);
}

