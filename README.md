# LumoTrade - AI Stock Brain

A futuristic AI-powered stock analysis platform with cyberpunk-inspired UI.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + CSS variables
- **Component Library**: shadcn/ui (Radix UI)
- **State Management**: Zustand
- **Data Fetching**: TanStack Query
- **Animations**: Framer Motion
- **Charts**: Recharts
- **Icons**: lucide-react
- **Utilities**: lodash
- **Database & Auth**: InstantDB

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) with your browser.

## Project Structure

The project follows atomic design principles:
- `src/components/design-system/atoms` - Smallest UI components
- `src/components/design-system/molecules` - Combinations of atoms
- `src/components/design-system/organisms` - Complex components
- `src/components/modules` - Feature-specific components
- `src/utils` - Utility functions organized by category
- `src/resources` - Mock data, constants, and schemas
- `src/hooks` - Custom React hooks
- `src/lib` - Third-party library configurations

## Features

- AI-powered stock summaries and insights
- Interactive trade planning with entry/target/stop zones
- Real-time catalyst tracking
- Watchlist management with InstantDB
- Trade history and notes
- Dark, neon, futuristic UI with glassmorphism
- Smooth animations with Framer Motion

## Development

This project uses Next.js 15 with the App Router and TypeScript for type safety.

