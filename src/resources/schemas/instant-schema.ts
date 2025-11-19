/**
 * InstantDB Schema Definition
 * This schema defines the database structure for LumoTrade
 */

export const instantSchema = {
  // User Profiles
  profiles: {
    fields: {
      userId: 'string',
      displayName: 'string',
      bio: 'string',
      avatar: 'string',
      totalTrades: 'number',
      winRate: 'number',
      profitLoss: 'number',
      joinedAt: 'number',
      verified: 'boolean',
    },
  },

  // Follow relationships
  follows: {
    fields: {
      followerId: 'string', // User who is following
      followingId: 'string', // User being followed
      createdAt: 'number',
    },
  },

  // Trade posts/ideas
  posts: {
    fields: {
      authorId: 'string',
      symbol: 'string',
      content: 'string',
      type: 'string', // 'idea', 'analysis', 'result'
      entry: 'number',
      target: 'number',
      stopLoss: 'number',
      status: 'string', // 'active', 'closed', 'cancelled'
      result: 'number', // P&L
      likes: 'number',
      createdAt: 'number',
      updatedAt: 'number',
    },
  },

  // Comments on posts
  comments: {
    fields: {
      postId: 'string',
      authorId: 'string',
      content: 'string',
      likes: 'number',
      createdAt: 'number',
    },
  },

  // Likes/Upvotes
  likes: {
    fields: {
      userId: 'string',
      targetId: 'string', // postId or commentId
      targetType: 'string', // 'post' or 'comment'
      createdAt: 'number',
    },
  },

  // Chat messages (for AI chat history)
  chatMessages: {
    fields: {
      userId: 'string',
      role: 'string', // 'user' or 'assistant'
      content: 'string',
      createdAt: 'number',
    },
  },

  // User watchlists (already handled by zustand, but for sync)
  watchlistItems: {
    fields: {
      userId: 'string',
      symbol: 'string',
      folderId: 'string',
      folderName: 'string',
      colorFlag: 'string',
      notes: 'string',
      addedAt: 'number',
    },
  },

  // Performance tracking
  trades: {
    fields: {
      userId: 'string',
      symbol: 'string',
      type: 'string', // 'long' or 'short'
      entry: 'number',
      exit: 'number',
      shares: 'number',
      profitLoss: 'number',
      profitLossPercent: 'number',
      entryDate: 'number',
      exitDate: 'number',
      status: 'string', // 'open' or 'closed'
      paperTrade: 'boolean',
      notes: 'string',
    },
  },
};
