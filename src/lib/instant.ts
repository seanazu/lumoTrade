import { init } from '@instantdb/react';

// Types for our schema
type Schema = {
  users: {
    id: string;
    email: string;
    createdAt: number;
  };
  watchlists: {
    id: string;
    userId: string;
    ticker: string;
    addedAt: number;
    notes?: string;
  };
  tradeHistory: {
    id: string;
    userId: string;
    ticker: string;
    type: 'entry' | 'exit' | 'note';
    price: number;
    timestamp: number;
    setup?: string;
    outcome?: string;
  };
  alerts: {
    id: string;
    userId: string;
    ticker: string;
    type: 'price' | 'catalyst' | 'custom';
    condition: string;
    target: number;
    isActive: boolean;
    createdAt: number;
  };
  preferences: {
    id: string;
    userId: string;
    theme: string;
    defaultTimeframe: string;
    maxRiskPerTrade: number;
  };
};

// Initialize InstantDB
// Note: Replace 'YOUR_APP_ID' with your actual InstantDB app ID
const APP_ID = process.env.NEXT_PUBLIC_INSTANT_APP_ID || 'YOUR_APP_ID';

export const db = init<Schema>({ appId: APP_ID });

