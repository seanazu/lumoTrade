# Backend Setup Guide

## Overview

This application uses a professional, production-ready backend architecture with multiple API integrations for real-time market data.

## Architecture

```
Frontend (React/Next.js)
    ↓
React Query Hooks (Data Fetching Layer)
    ↓
Next.js API Routes (Backend Middleware)
    ↓
API Clients (Polygon, Marketaux, FMP)
    ↓
External APIs + WebSocket Connections
```

## Features

- ✅ **Real-time Market Data** via FMP (indices) & Polygon.io (stocks)
- ✅ **Live News with Sentiment** via Marketaux
- ✅ **WebSocket Streaming** for instant price updates
- ✅ **Smart Caching** to reduce API calls
- ✅ **Rate Limiting** to prevent quota exhaustion
- ✅ **Automatic Retry** with exponential backoff
- ✅ **Error Handling** with graceful fallbacks
- ✅ **TypeScript** for full type safety

## API Usage Strategy

Different APIs are used for different data types based on availability and cost:

| Data Type | Primary API | Reason |
|-----------|------------|--------|
| **Market Indices** (S&P 500, Dow, NASDAQ, Russell 2000) | **FMP** | Polygon requires paid plan ($99+/month) for index data. FMP includes indices on free tier. |
| **Individual Stocks** | **Polygon** | Excellent free tier for stock quotes and real-time data. |
| **Market News** | **Marketaux** | High-quality news with sentiment analysis and entity extraction. |
| **Company Profiles** | **FMP** | Comprehensive fundamental data and financial statements. |

This strategy maximizes the use of free tiers while maintaining high-quality data access.

## Setup Instructions

### 1. Get API Keys

You need API keys from these providers:

#### Financial Modeling Prep (FMP) - **Required for Index Data**
- Sign up: https://site.financialmodelingprep.com/
- Get your API key
- Free tier: 250 requests/day
- **Used for**: Market indices (S&P 500, Dow, NASDAQ, Russell 2000)
- **Why required**: Polygon.io requires a paid plan ($99+/month) for index data

#### Polygon.io - **Required for Stock Data**
- Sign up: https://polygon.io/
- Get your API key from dashboard
- Free tier: 5 requests/minute
- **Used for**: Individual stock quotes and real-time data

#### Marketaux - **Required for News**
- Sign up: https://www.marketaux.com/
- Get your API token
- Free tier: 100 requests/day
- **Used for**: Market news with sentiment analysis

### 2. Configure Environment Variables

Create a `.env.local` file in the project root:

```bash
# Copy the example file
cp .env.example .env.local
```

Edit `.env.local` and add your API keys:

```env
POLYGON_API_KEY=your_actual_polygon_key_here
MARKETAUX_API_KEY=your_actual_marketaux_key_here
FMP_API_KEY=your_actual_fmp_key_here
OPENAI_API_KEY=your_openai_key_here
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## API Endpoints

### Market Indexes
`GET /api/market/indexes`

Returns real-time data for major market indexes (S&P 500, NASDAQ, DOW, Russell 2000).

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "symbol": "^GSPC",
      "name": "S&P 500",
      "price": 5048.42,
      "change": 22.58,
      "changePercent": 0.45,
      "high": 5065.30,
      "low": 5032.10,
      "volume": 3456000000,
      "p0": 4900,
      "p50": 5048,
      "p90": 5200
    }
  ],
  "source": "polygon",
  "timestamp": 1700000000000
}
```

### Market News
`GET /api/market/news?limit=10`

Returns latest market news with sentiment analysis.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "title": "Fed Signals Potential Rate Pause",
      "summary": "Federal Reserve officials indicated...",
      "sentiment": "bullish",
      "importance": "high",
      "time": "2h ago",
      "source": "Federal Reserve"
    }
  ],
  "source": "marketaux",
  "timestamp": 1700000000000
}
```

### Stock Quote
`GET /api/stock/quote/{symbol}`

Returns real-time quote for a specific stock.

**Response:**
```json
{
  "success": true,
  "data": {
    "symbol": "AAPL",
    "price": 178.52,
    "change": 2.34,
    "changePercent": 1.33,
    "high": 179.20,
    "low": 177.10,
    "volume": 45678900,
    "previousClose": 176.18,
    "source": "polygon"
  },
  "timestamp": 1700000000000
}
```

## React Hooks

### useMarketIndexes
Fetches real-time market indexes with auto-refresh.

```typescript
import { useMarketIndexes } from '@/hooks/useMarketIndexes';

function Component() {
  const { data, isLoading, error } = useMarketIndexes();
  
  // data: IndexData[]
  // Auto-refreshes every 30s during market hours
}
```

### useMarketNews
Fetches latest market news with sentiment.

```typescript
import { useMarketNews } from '@/hooks/useMarketNews';

function Component() {
  const { data, isLoading, error } = useMarketNews(10);
  
  // data: MarketStory[]
  // Auto-refreshes every 5 minutes
}
```

### useStockQuote
Fetches real-time quote for a specific stock.

```typescript
import { useStockQuote } from '@/hooks/useStockQuote';

function Component() {
  const { data, isLoading, error } = useStockQuote('AAPL');
  
  // Auto-refreshes every 30 seconds
}
```

### useRealtimePrice
Subscribes to live WebSocket price updates.

```typescript
import { useRealtimePrice } from '@/hooks/useRealtimePrice';

function Component() {
  const { prices, isConnected } = useRealtimePrice(['AAPL', 'GOOGL']);
  
  // prices: Map<string, RealtimePrice>
  // Updates in real-time via WebSocket
}
```

## Caching Strategy

- **Market Indexes**: 30 seconds cache
- **Market News**: 5 minutes cache
- **Stock Quotes**: 30 seconds cache

Caching reduces API calls and improves performance while maintaining data freshness.

## Rate Limiting

The backend automatically manages rate limits:

- **Polygon**: 5 requests/minute
- **Marketaux**: 100 requests/day  
- **FMP**: 250 requests/day

Requests are throttled to stay within limits. Cached data is returned when limits are approached.

## WebSocket Connection

The app automatically connects to Polygon's WebSocket for real-time data:

1. Connection established on app load
2. Authentication with API key
3. Auto-reconnect with exponential backoff
4. Subscribe/unsubscribe to symbols dynamically

## Error Handling

The backend gracefully handles errors:

- **No API Key**: Falls back to mock data
- **API Error**: Uses cached data or mock data
- **Rate Limit**: Returns cached data
- **Network Error**: Retries with exponential backoff

## Testing the Backend

### 1. Test API Routes Directly

```bash
# Test indexes endpoint
curl http://localhost:3000/api/market/indexes

# Test news endpoint  
curl http://localhost:3000/api/market/news?limit=5

# Test stock quote
curl http://localhost:3000/api/stock/quote/AAPL
```

### 2. Check Console Logs

The backend logs useful information:

- ✅ API configuration status
- 📡 WebSocket connection status
- ⚠️ Rate limit warnings
- ❌ Error messages with details

### 3. Verify Data Source

Look for the data source indicator in the UI:
- **"📡 Live data connected"** = Real API data
- **No indicator** = Mock/cached data

## Troubleshooting

### "Using mock data" message
- **Cause**: API keys not configured
- **Fix**: Add valid API keys to `.env.local`

### "Rate limit exceeded" warning
- **Cause**: Too many API requests
- **Fix**: Wait for rate limit window to reset

### WebSocket not connecting
- **Cause**: Invalid Polygon API key or network issue
- **Fix**: Check API key and internet connection

### No real-time updates
- **Cause**: WebSocket disconnected or free tier limitations
- **Fix**: Polygon free tier may have WebSocket restrictions

## Next Steps

### Phase 2: Stock Analyzer
- Connect stock analyzer page to backend
- Add historical chart data
- Implement technical indicators

### Phase 3: Advanced Features
- Server-side caching with Redis
- Database integration for historical data
- Advanced WebSocket subscriptions
- User-specific rate limiting

## Support

For issues or questions:
1. Check console logs for errors
2. Verify API keys are valid
3. Check API provider documentation
4. Review this guide

## API Documentation Links

- **Polygon.io**: https://polygon.io/docs
- **Marketaux**: https://www.marketaux.com/documentation
- **FMP**: https://site.financialmodelingprep.com/developer/docs

