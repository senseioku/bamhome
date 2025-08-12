# BAM Ecosystem - Build And Multiply Token DeFi Platform

## Overview
The BAM Ecosystem is a comprehensive DeFi platform centered around the BAM token. It's a full-stack web application designed to offer various DeFi products, including a token swap, AI-powered chat functionality, and future gaming (Play 2 Earn) and airdrop (BAM Drops) platforms. The project aims to build wealth collectively, leveraging community engagement and robust tokenomics. Its ambition is to establish BAM as a prominent token in the DeFi space, offering utility, deflationary mechanisms, and investor confidence through transparent vesting schedules and a secure ecosystem.

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
- ✅ BAM AIChat production audit completed - all systems operational
- ✅ Bidirectional wallet integration between BAM Swap and AIChat implemented
- ✅ Claude 4.0 Sonnet AI integration with token-gated access fully functional
- ✅ Serverless architecture deployed and tested - ready for production
- ✅ BAM AIChat badge updated to Beta status for accurate platform representation
- ✅ Mobile UI text overlap issue fixed with improved header layout and spacing
- ✅ Enhanced chat content formatting for professional appearance (removed # and * symbols)
- ✅ Production-ready user database with wallet-based username system implemented
- ✅ Username creation dialog added with validation and availability checking
- ✅ Enhanced descriptions updated for business and wealth building focus
- ✅ Wallet connection/disconnection functionality added matching BAM Swap interface
- ✅ Copy wallet address feature with visual feedback implemented
- ✅ Enterprise-grade security implemented with comprehensive rate limiting and abuse prevention
- ✅ Multi-layer security architecture with Helmet, CORS, input validation, and IP-based blocking
- ✅ Progressive rate limiting (100 requests/15min general, 10 chat/min, 3 username/hour, 5 auth/15min)
- ✅ Advanced abuse detection with 24-hour IP blocking after 20 failed attempts
- ✅ Security monitoring with detailed request tracking and suspicious activity logging
- ✅ Input sanitization with NoSQL injection prevention and HTTP parameter pollution protection
- ✅ AI Chat expanded to handle ALL topics: crypto, business, technology, science, education, cooking, travel, entertainment, and everyday questions
- ✅ General category configured for comprehensive assistance beyond crypto/business topics
- ✅ Enhanced AI system prompt supports both specialized crypto/DeFi expertise and general knowledge assistance
- ✅ Production-ready performance optimizations implemented with compression, caching, and monitoring
- ✅ Advanced database query optimization with intelligent caching and pagination
- ✅ Enterprise-grade scalability features including memory management and graceful shutdown
- ✅ Frontend performance enhancements with optimized chat hooks and loading states
- ✅ Comprehensive monitoring and metrics collection for production deployment
- ✅ Database-backed chat history recording with PostgreSQL integration implemented
- ✅ Rate limiting system enforces maximum 10 recent conversations per user with automatic cleanup
- ✅ Chat conversations display with visible timestamps and organized by recency
- ✅ Enhanced username profile system with wallet-based authentication and database storage
- ✅ Conversation management includes soft-deletion of oldest chats when limit exceeded
- ✅ Conservative API rate limiting implemented to protect Claude API credits
- ✅ Multi-tier rate limiting: 2 AI calls/minute, 50 AI calls/day, 100 general requests/15min
- ✅ Tiered protection system prevents API credit exhaustion while maintaining user experience
- ✅ User-friendly rate limit messages with specific wait times and helpful tips
- ✅ Enhanced error handling provides clear guidance on when users can retry actions
- ✅ Rate limit messages include context about service preservation and next attempt times
- ✅ Profile editing functionality implemented with username and display name updates
- ✅ Edit Profile button added to wallet menu for authenticated users with existing profiles
- ✅ Profile update system includes rate limiting protection and friendly error messages
- ✅ Username availability checking prevents conflicts during profile updates
- ✅ 30-day username change restriction implemented to maintain community stability
- ✅ Frontend validation shows users exactly when they can change username again
- ✅ Database schema updated with lastUsernameChange timestamp tracking
- ✅ Friendly error messages inform users about the 30-day waiting period
- ✅ Required email and country fields enforced for all user profiles
- ✅ Searchable country dropdown with 180+ countries for compliance
- ✅ Email validation implemented with proper format checking
- ✅ User profile creation requires real email addresses and country selection
- ✅ Edit profile functionality includes email and country update capabilities
- ✅ AI-specific rate limiting implemented with user-friendly notifications
- ✅ Rate limits significantly increased (100 messages/minute, 25 conversations/5min, 200 daily)
- ✅ General site navigation unrestricted - no more 429 errors blocking interface
- ✅ Friendly rate limit messages show next attempt time and helpful tips
- ✅ Site remains fully functional with targeted rate limiting for AI usage only
- ✅ Copy button feature added to all chat messages with hover functionality
- ✅ Messages can be copied to clipboard with visual feedback and toast notifications
- ✅ Professional copy icon design matching the DeepSeek-style interface
- ✅ Production CORS configuration fixed for bam-ecosystem.com domain compatibility
- ✅ Enhanced API headers for Cloudflare proxy compatibility and security
- ✅ Wallet address normalization implemented to fix chat history persistence
- ✅ Copy button repositioned below messages for improved mobile accessibility
- ✅ Navigation dropdown positioning fixed with align="end" to prevent off-screen display
- ✅ Smooth animations added to all navigation menus with hover effects and transitions
- ✅ Mobile BAM Swap link responsiveness improved with proper anchor tag conversion
- ✅ "Later" button removed from DailyMotivation component as requested
- ✅ BSCScan API integration implemented for real-time BAM token holder data
- ✅ Success celebration messages enhanced with live BAM holder count display
- ✅ Automatic holder data updates every 5 minutes with fallback to estimated counts