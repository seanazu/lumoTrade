# 🍋 LumoTrade - AI-Powered Stock Intelligence Platform

<div align="center">

![LumoTrade](https://img.shields.io/badge/LumoTrade-AI%20Stock%20Intelligence-84cc16?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=for-the-badge&logo=tailwind-css)

**Modern, AI-powered stock trading platform with real-time analysis, social features, and comprehensive analytics.**

[Features](#-features) • [Setup](#-quick-start) • [Demo](#-screenshots) • [API](#-api) • [Contributing](#-contributing)

</div>

---

## ✨ Features

### 🤖 AI-Powered Intelligence
- **Real-time AI Chat Assistant** - Ask anything about stocks, get instant analysis
- **Pattern Recognition** - Automatically detects chart patterns (double tops/bottoms, breakouts)
- **Sentiment Analysis** - AI-powered market sentiment from news and social data
- **Predictive Analytics** - Machine learning models for price predictions

### 📊 Advanced Trading Tools
- **Live Price Streaming** - Real-time WebSocket updates with flash animations
- **TradingView-Style Watchlist** - Organize stocks with folders and color flags
- **Strategy Backtesting** - Test your strategies on historical data
- **Performance Dashboard** - Track win rate, P&L, equity curve, and detailed analytics
- **Risk Management** - Calculate position sizes, stop losses, and risk/reward ratios

### 🌐 Social & Community
- **Trading Feed** - Share ideas, follow traders, like and comment on posts
- **Leaderboards** - Compete in trading challenges and win prizes
- **User Profiles** - Build reputation with verified badges and follower counts
- **Learning Center** - AI-generated tutorials and expert trading courses

### 📱 Modern Experience
- **Progressive Web App** - Install on any device, works offline
- **Dark & Light Themes** - Beautiful dark mode + refreshing "Lemon Fresh" light mode
- **Mobile Optimized** - Bottom navigation, swipe gestures, pull-to-refresh
- **Smooth Animations** - Framer Motion throughout for delightful interactions
- **Push Notifications** - Get alerts for price movements, patterns, and news

### 🔧 Developer Tools
- **Public API** - RESTful endpoints for stock data and AI analysis
- **WebSocket Streaming** - Real-time price feeds for your applications
- **Comprehensive Docs** - Full API documentation with code examples
- **Rate Limiting** - Fair usage policies with tiered access

---

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.18.0
- npm >= 8.0.0

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/lumotrade.git
cd lumotrade

# Install dependencies
npm install

# Create environment file
cp .env.local.example .env.local

# Add your API keys to .env.local
# - OPENAI_API_KEY
# - RESEND_API_KEY
# - NEXT_PUBLIC_INSTANT_APP_ID

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📸 Screenshots

### Market Overview Dashboard
Modern, clean interface with live market data and AI predictions.

### AI Stock Analyzer
Comprehensive analysis with technical indicators, patterns, and AI insights.

### Performance Dashboard
Track your trading performance with detailed analytics and equity curves.

### Social Trading Feed
Connect with other traders, share ideas, and learn from the community.

---

## 🎨 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS + Framer Motion
- **UI Components**: Radix UI + shadcn/ui
- **State Management**: Zustand with persistence
- **Data Fetching**: TanStack Query
- **Database**: InstantDB (real-time sync)
- **AI**: OpenAI GPT-4 + Vercel AI SDK
- **Charts**: Recharts
- **Email**: Resend + React Email
- **PWA**: next-pwa

---

## 🔌 API

### Authentication
All API requests require an API key in the header:

```bash
curl -H "x-api-key: your_api_key" \
  https://lumotrade.com/api/v1/ticker/AAPL
```

### Endpoints

#### Get Stock Data
```
GET /api/v1/ticker/:symbol
```

Returns real-time price, volume, market cap, and key metrics.

#### Get AI Analysis
```
GET /api/v1/analysis/:symbol
```

Returns AI-powered sentiment analysis, price targets, and technical insights.

### Rate Limits
- **Free Tier**: 100 requests/hour
- **Pro Tier**: 1,000 requests/hour
- **Enterprise**: Unlimited

Visit `/api-docs` for complete documentation.

---

## 📦 Project Structure

```
src/
├── app/                 # Next.js pages (App Router)
├── components/          # React components
│   ├── design-system/  # Reusable UI atoms, molecules, organisms
│   └── modules/        # Feature-specific components
├── lib/                # Core business logic
│   ├── ai/            # AI & pattern detection
│   ├── websocket/     # Real-time price streaming
│   └── zustand/       # State management
├── hooks/              # Custom React hooks
├── utils/              # Helper functions
└── types/              # TypeScript definitions
```

---

## 🧪 Testing Strategy

```bash
# Run type checking
npm run type-check

# Run linting
npm run lint

# Build for production
npm run build
```

---

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Environment Variables
Set these in your deployment platform:
- `OPENAI_API_KEY`
- `RESEND_API_KEY`
- `NEXT_PUBLIC_INSTANT_APP_ID`
- `API_KEY_SECRET`

---

## 🗺️ Roadmap

- [x] Phase 1: Quick Wins (AI Chat, Real-time, Sharing, Notifications, Onboarding)
- [x] Phase 2: Growth Features (Patterns, Social, Dashboard, Mobile, Newsletter)
- [x] Phase 3: Platform Expansion (PWA, API, Backtesting, Community)
- [ ] Phase 4: Native Apps (React Native with Capacitor)
- [ ] Phase 5: Advanced AI (Voice commands, AR alerts, 3D visualization)
- [ ] Phase 6: Monetization (Premium tiers, white-label, marketplace)

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is private and proprietary. All rights reserved.

---

## 🙏 Acknowledgments

- **OpenAI** for GPT-4 API
- **Vercel** for hosting and AI SDK
- **InstantDB** for real-time database
- **shadcn/ui** for beautiful components
- **Radix UI** for accessible primitives

---

## 📞 Contact

- Website: [lumotrade.com](https://lumotrade.com)
- Email: hello@lumotrade.com
- Twitter: [@LumoTrade](https://twitter.com/lumotrade)

---

<div align="center">

**Built with ❤️ using modern AI tools and best practices**

⭐ Star this repo if you find it useful!

</div>
