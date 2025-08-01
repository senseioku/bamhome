# BAM Ecosystem - Build And Multiply Token DeFi Platform

## Overview
The BAM Ecosystem is a comprehensive DeFi platform centered around the BAM token. It's a full-stack web application designed to offer various DeFi products, including a token swap, presale functionalities, and future gaming (Play 2 Earn) and airdrop (BAM Drops) platforms. The project aims to build wealth collectively, leveraging community engagement and robust tokenomics. Its ambition is to establish BAM as a prominent token in the DeFi space, offering utility, deflationary mechanisms, and investor confidence through transparent vesting schedules and a secure ecosystem.

## Recent Changes (August 2025)
- **Vercel Deployment Configuration**: Fixed runtime specification from invalid `nodejs18.x` to proper `@vercel/node@3.0.7` format
- **Routing Fix**: Implemented `functions`/`rewrites` configuration to resolve 404 errors in production deployment
- **Build Process**: Optimized build pipeline generating 40.7kb server bundle and frontend assets in `dist/public/`
- **Security Implementation**: Production-ready cryptographic wallet verification with 10M+ BAM token requirement for AIChat access

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
- **BAM AIChat**: Production-ready AI chat platform with Claude 4.0 Sonnet integration, featuring cryptographic wallet signature verification, 10M+ BAM token requirement, conversation management, crypto market data, and educational content delivery.
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