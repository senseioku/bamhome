# BAM Ecosystem - Build And Multiply Token DeFi Platform

## Overview
The BAM Ecosystem is a comprehensive DeFi platform centered around the BAM token. It's a full-stack web application designed to offer various DeFi products, including a token swap, presale functionalities, and future gaming (Play 2 Earn) and airdrop (BAM Drops) platforms. The project aims to build wealth collectively, leveraging community engagement and robust tokenomics. Its ambition is to establish BAM as a prominent token in the DeFi space, offering utility, deflationary mechanisms, and investor confidence through transparent vesting schedules and a secure ecosystem.

## User Preferences
Preferred communication style: Senior engineer level - technical, direct, AI-powered analysis with stored information utilization.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Routing**: Wouter
- **UI Framework**: Shadcn/ui (using Radix UI primitives)
- **Styling**: Tailwind CSS with a custom golden-themed dark mode.
- **State Management**: TanStack Query
- **Form Handling**: React Hook Form with Zod validation.

### Backend
- **Framework**: Express.js with TypeScript
- **Module System**: ES Modules
- **Database ORM**: Drizzle ORM
- **Database**: PostgreSQL (configured for Neon Database)
- **Session Management**: Connect-pg-simple for PostgreSQL session storage.

### Key Design Decisions
- **Monorepo Structure**: Client, server, and shared code within a single repository for streamlined development.
- **Type Safety**: Comprehensive TypeScript implementation across both frontend and backend for enhanced code reliability.
- **Component Library**: Utilization of Shadcn/ui for consistent, accessible, and high-quality UI components.
- **Dark Theme**: A custom dark theme with a golden color scheme, aligning with DeFi/crypto aesthetics and BAM token branding.
- **Modern Build Pipeline**: Vite powers fast development and optimized production builds.
- **Responsive Design**: Mobile-first approach with flexible layouts for various screen sizes.
- **Animations & Glassmorphism**: Smooth transitions, hover effects, and modern frosted glass elements for an engaging user experience.
- **Security**: Mandatory wallet signature verification for all connections to prevent unauthorized access and protect user data.
- **Contract Architecture**: Granular pause controls, dynamic pricing mechanisms, and comprehensive administrative tools for flexibility and security.
- **Tokenomics Implementation**: Integration of vesting schedules, anti-dump mechanisms, and a 25% initial token burn to a verified BSCScan burn address.

### Key Features
- **BAM Swap**: Enables various token swaps (USDT, BNB, BAM, USDB) with a dynamic fee structure, real-time pricing via Chainlink oracles and CoinGecko fallback, and flexible purchase limits. Includes professional token selection, quote displays, and transaction notifications.
- **Presale System**: Multi-phase presale with dynamic pricing, adjustable purchase limits, and real-time token tracking.
- **Tokenomics Visualization**: Detailed overview of token distribution, vesting timelines, and allocation cards.
- **Contextual Learning System**: Interactive pop-ups and tooltips providing educational content on wallet security, presale phases, gas fees, and trading.
- **Motivational System**: Daily motivational messages designed to foster community engagement.

## External Dependencies

### Frontend Dependencies
- **UI Components**: Radix UI (primitives for accessibility).
- **Styling**: Tailwind CSS.
- **Charts**: Recharts.
- **Icons**: Lucide React.
- **Forms**: React Hook Form with Hookform/resolvers.

### Backend Dependencies
- **Database**: Neon Database (PostgreSQL-compatible).
- **Session Storage**: Connect-pg-simple (for PostgreSQL sessions).
- **Development**: TSX (for TypeScript execution).
- **Build Tools**: ESBuild (for production bundling).

### APIs & Services
- **Blockchain Interaction**: Web3.js for interacting with the Binance Smart Chain (BSC) network.
- **Price Feeds**: Chainlink price feeds (BNB/USD oracle on BSC mainnet) with CoinGecko API as a fallback for reliable token pricing.
- **BSCScan**: For burn verification and transaction transparency.
- **AI Services**: Anthropic Claude API for AI chat functionality with crypto-focused responses.

## Deployment Configuration

### Vercel Setup (January 2025)
- **Serverless Functions**: `/api/ai.js` for Claude AI chat, `/api/wallet/verify.js` for token verification
- **Build Command**: `vite build` (optimized for Vercel with legacy peer deps)
- **Runtime**: Node.js 18.x with individual `.vc-config.json` function configurations
- **Environment Variables**: ANTHROPIC_API_KEY required for AI chat functionality
- **Mobile Optimization**: Compact interface with fixed chat input positioning - **VERIFIED WORKING**

### Recent Updates (January 2025)
- ✅ All TypeScript errors resolved in AiChat component using proper type assertions
- ✅ Vercel build configuration optimized with `vite build` and `--legacy-peer-deps`
- ✅ Mobile interface confirmed working perfectly on production devices
- ✅ Wallet verification system displaying proper error messages and requirements
- ✅ BAM AIChat ready for full production deployment