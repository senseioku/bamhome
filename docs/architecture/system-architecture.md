# System Architecture

The BAM Ecosystem is built on a modern, scalable architecture that prioritizes performance, security, and maintainability. This document provides a comprehensive overview of the system's technical architecture.

## Architecture Overview

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   React App     │◄──►│   Express.js    │◄──►│   PostgreSQL    │
│   (Vite)        │    │   API Server    │    │   (Neon)        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Blockchain    │    │   AI Services   │    │   External      │
│   BSC Network   │    │   Claude API    │    │   APIs          │
│   Web3.js       │    │   Anthropic     │    │   Chainlink     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Frontend Architecture

### Technology Stack
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state management
- **UI Framework**: Shadcn/ui components built on Radix UI primitives

### Component Architecture

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components (shadcn/ui)
│   ├── forms/          # Form components
│   └── navigation/     # Navigation components
├── pages/              # Page-level components
│   ├── home.tsx        # Landing page
│   ├── swap.tsx        # BAM Swap interface
│   └── ai-chat.tsx     # AI Chat interface
├── lib/                # Utility libraries
│   ├── utils.ts        # General utilities
│   ├── queryClient.ts  # TanStack Query configuration
│   └── web3.ts         # Web3 integration utilities
└── hooks/              # Custom React hooks
    ├── use-wallet.ts   # Wallet connection hook
    └── use-toast.ts    # Toast notification hook
```

### Design System
- **Theme**: Custom dark theme with golden accents
- **Typography**: Tailwind CSS typography system
- **Spacing**: Consistent spacing scale
- **Animations**: Framer Motion for smooth transitions
- **Responsiveness**: Mobile-first responsive design

## Backend Architecture

### Technology Stack
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Session Management**: Connect-pg-simple for PostgreSQL session storage
- **Security**: Multiple security middleware layers
- **Module System**: ES Modules for modern JavaScript

### API Architecture

```
server/
├── routes/             # API route definitions
│   ├── auth.ts        # Authentication routes
│   ├── swap.ts        # Swap-related endpoints
│   ├── ai.ts          # AI chat endpoints
│   └── wallet.ts      # Wallet operations
├── middleware/        # Express middleware
│   ├── auth.ts        # Authentication middleware
│   ├── rateLimit.ts   # Rate limiting
│   └── security.ts    # Security middleware
├── services/          # Business logic services
│   ├── aiService.ts   # AI integration service
│   ├── priceService.ts # Price feed service
│   └── walletService.ts # Wallet operations
└── utils/             # Server utilities
    ├── database.ts    # Database utilities
    └── validation.ts  # Input validation
```

### API Design Principles
- **RESTful Design**: Standard REST API patterns
- **Type Safety**: TypeScript throughout the stack
- **Error Handling**: Consistent error response format
- **Validation**: Comprehensive input validation with Zod
- **Documentation**: Self-documenting API with TypeScript types

## Database Architecture

### Database Schema

```sql
-- Users table
users (
  id SERIAL PRIMARY KEY,
  username VARCHAR UNIQUE NOT NULL,
  wallet_address VARCHAR UNIQUE NOT NULL,
  email VARCHAR NOT NULL,
  country VARCHAR NOT NULL,
  display_name VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  last_username_change TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Chat conversations
conversations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  title VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Chat messages
messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER REFERENCES conversations(id),
  user_id INTEGER REFERENCES users(id),
  content TEXT NOT NULL,
  role VARCHAR NOT NULL, -- 'user' or 'assistant'
  created_at TIMESTAMP DEFAULT NOW()
);

-- Sessions table (managed by connect-pg-simple)
sessions (
  sid VARCHAR PRIMARY KEY,
  sess JSON NOT NULL,
  expire TIMESTAMP NOT NULL
);
```

### Data Management
- **Migrations**: Schema versioning with Drizzle migrations
- **Indexing**: Optimized database indexes for performance
- **Constraints**: Foreign key constraints and data integrity
- **Cleanup**: Automatic cleanup of old data

## Security Architecture

### Multi-Layer Security

#### Authentication & Authorization
- **Wallet-based Authentication**: No traditional passwords
- **Signature Verification**: Cryptographic signature validation
- **Session Management**: Secure session handling with PostgreSQL
- **Role-based Access**: Granular permission system

#### API Security
- **Rate Limiting**: Multi-tier rate limiting system
- **Input Validation**: Comprehensive data validation
- **CORS Protection**: Cross-origin request security
- **HTTP Security**: Helmet.js security headers
- **SQL Injection Prevention**: ORM-based query protection

#### Network Security
- **TLS Encryption**: HTTPS everywhere
- **Content Security Policy**: XSS protection
- **IP Blocking**: Automatic abuse detection and blocking
- **DDoS Protection**: Request throttling and blocking

### Security Monitoring
- **Audit Logging**: Comprehensive security event logging
- **Abuse Detection**: Automated suspicious activity detection
- **Alert System**: Real-time security alert notifications
- **Incident Response**: Automated incident response procedures

## Integration Architecture

### Blockchain Integration

#### Web3 Connectivity
- **Multiple Providers**: RPC endpoint redundancy
- **Connection Management**: Automatic failover between providers
- **Transaction Handling**: Secure transaction submission and monitoring
- **Event Listening**: Real-time blockchain event monitoring

#### Smart Contract Integration
- **Contract ABIs**: Type-safe contract interaction
- **Gas Optimization**: Efficient gas usage patterns
- **Error Handling**: Comprehensive contract error handling
- **Upgrade Safety**: Safe contract upgrade patterns

### External Service Integration

#### AI Services
- **Anthropic Claude**: Primary AI service provider
- **API Management**: Efficient API usage and rate limiting
- **Error Handling**: Graceful degradation on service issues
- **Response Processing**: Intelligent response formatting

#### Price Feeds
- **Chainlink Oracles**: Primary price data source
- **CoinGecko API**: Backup price data provider
- **Data Validation**: Price feed accuracy verification
- **Caching**: Efficient price data caching

## Deployment Architecture

### Development Environment
- **Local Development**: Docker-compose development stack
- **Hot Reloading**: Fast development feedback loop
- **Environment Variables**: Secure configuration management
- **Database Migrations**: Automated schema management

### Production Environment
- **Vercel Deployment**: Serverless production hosting
- **Database**: Neon PostgreSQL managed database
- **CDN**: Global content delivery network
- **Monitoring**: Comprehensive application monitoring

### Scalability Considerations
- **Horizontal Scaling**: Stateless application design
- **Database Scaling**: Read replicas and connection pooling
- **Caching**: Multi-level caching strategy
- **Load Balancing**: Automatic request distribution

## Performance Architecture

### Frontend Performance
- **Code Splitting**: Lazy loading for optimal bundle sizes
- **Image Optimization**: Responsive and compressed images
- **Caching**: Browser and service worker caching
- **Bundle Optimization**: Tree shaking and minification

### Backend Performance
- **Database Optimization**: Query optimization and indexing
- **Connection Pooling**: Efficient database connection management
- **Compression**: Response compression for faster delivery
- **Memory Management**: Efficient memory utilization

### Monitoring & Analytics
- **Performance Metrics**: Real-time performance monitoring
- **Error Tracking**: Comprehensive error monitoring and alerting
- **User Analytics**: Privacy-respecting usage analytics
- **System Health**: Infrastructure health monitoring

## Data Flow Architecture

### Request Processing Flow

```
User Action → Frontend → API Gateway → Middleware Chain → Business Logic → Database → Response
     ↓           ↓            ↓             ↓              ↓           ↓         ↑
Validation → Auth Check → Rate Limit → Processing → Data Access → Response Format
```

### Real-time Data Flow
- **WebSocket Connections**: Real-time updates where needed
- **Polling Strategy**: Efficient polling for price updates
- **Event-driven Updates**: Blockchain event-driven state updates
- **Cache Invalidation**: Intelligent cache invalidation strategies

## Technology Decisions

### Why These Technologies?

#### Frontend Choices
- **React 18**: Modern React features and ecosystem
- **TypeScript**: Type safety and developer experience
- **Vite**: Fast build times and hot module replacement
- **Tailwind CSS**: Utility-first styling for rapid development

#### Backend Choices
- **Express.js**: Mature, flexible web framework
- **Drizzle ORM**: Type-safe database operations
- **PostgreSQL**: Robust relational database with JSON support
- **TypeScript**: End-to-end type safety

#### Integration Choices
- **Binance Smart Chain**: Lower fees and faster transactions
- **Anthropic Claude**: Advanced AI capabilities
- **Chainlink**: Reliable decentralized price feeds
- **Vercel**: Seamless deployment and scaling

---

This architecture provides a solid foundation for the BAM Ecosystem's current needs while maintaining flexibility for future growth and feature additions. The design emphasizes security, performance, and developer experience while ensuring the platform can scale to meet increasing user demand.