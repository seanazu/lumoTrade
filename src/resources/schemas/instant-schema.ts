/**
 * InstantDB Schema Definition
 * 
 * This file documents the schema structure for InstantDB.
 * Actual schema is defined in the InstantDB dashboard.
 */

export const instantDBSchema = {
  users: {
    fields: {
      id: 'string',
      email: 'string',
      createdAt: 'timestamp',
    },
  },
  watchlists: {
    fields: {
      id: 'string',
      userId: 'string', // Foreign key to users
      ticker: 'string',
      addedAt: 'timestamp',
      notes: 'string?', // Optional
    },
    indexes: ['userId', 'ticker'],
  },
  tradeHistory: {
    fields: {
      id: 'string',
      userId: 'string',
      ticker: 'string',
      type: "'entry' | 'exit' | 'note'",
      price: 'number',
      timestamp: 'timestamp',
      setup: 'string?',
      outcome: 'string?',
    },
    indexes: ['userId', 'ticker', 'timestamp'],
  },
  alerts: {
    fields: {
      id: 'string',
      userId: 'string',
      ticker: 'string',
      type: "'price' | 'catalyst' | 'custom'",
      condition: 'string',
      target: 'number',
      isActive: 'boolean',
      createdAt: 'timestamp',
    },
    indexes: ['userId', 'isActive'],
  },
  preferences: {
    fields: {
      id: 'string',
      userId: 'string',
      theme: 'string',
      defaultTimeframe: 'string',
      maxRiskPerTrade: 'number',
    },
    indexes: ['userId'],
  },
} as const;

