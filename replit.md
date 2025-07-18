# BAM Ecosystem - Build And Multiply Token DeFi Platform

## Overview

This is a comprehensive DeFi (Decentralized Finance) platform for the BAM (Build And Multiply) token ecosystem. The project is a full-stack web application built with React on the frontend and Express.js on the backend, featuring a modern UI library, database integration, and a complete token ecosystem with multiple DeFi products.

## Recent Changes (July 18, 2025)

✓ Enhanced tokenomics section with professional vesting schedules and anti-dump mechanisms
✓ Added comprehensive vesting timeline visualization with progress indicators
✓ Implemented token metrics overview showcasing deflationary and utility features
✓ Created detailed allocation cards with TGE unlock percentages and cliff periods
✓ Added best-practice vesting highlights for investor confidence
✓ Updated branding throughout site to use "BAM" (removed dots from B.A.M)
✓ Integrated official BAM Token logo across navigation, hero section, ecosystem overview, and footer
✓ Added favicon with BAM Token logo for browser tab branding
✓ Enhanced community-driven messaging throughout all sections
✓ Fixed Vercel deployment configuration (resolved functions/builds conflict)
✓ Confirmed production build success with all assets properly included
✓ Created comprehensive deployment guide for Vercel production deployment

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for development and production builds
- **Routing**: Wouter for client-side routing
- **UI Framework**: Shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with custom dark theme
- **State Management**: TanStack Query for server state management
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Module System**: ES Modules
- **Database ORM**: Drizzle ORM
- **Database**: PostgreSQL (configured for Neon Database)
- **Session Management**: Connect-pg-simple for PostgreSQL session storage
- **Development Server**: Hot reload with Vite integration

### Key Design Decisions
- **Monorepo Structure**: Client, server, and shared code in one repository
- **Type Safety**: Full TypeScript coverage across frontend and backend
- **Component Library**: Shadcn/ui for consistent, accessible components
- **Dark Theme**: Custom dark theme focused on DeFi/crypto aesthetics
- **Modern Build Pipeline**: Vite for fast development and optimized production builds

## Key Components

### Database Schema
- **Users Table**: Basic user authentication with username/password
- **Drizzle ORM**: Type-safe database queries and migrations
- **PostgreSQL**: Production-ready relational database

### Frontend Components
- **Landing Page**: Complete marketing site with hero, features, tokenomics
- **Navigation**: Responsive header with mobile menu
- **Tokenomics Visualization**: Interactive pie chart showing token distribution
- **Ecosystem Overview**: Cards showcasing different DeFi products
- **Projects Section**: Grid of upcoming and available features
- **Roadmap**: Timeline of development milestones
- **CTA Section**: Call-to-action with external links

### UI System
- **Design System**: Consistent spacing, colors, and typography
- **Responsive Design**: Mobile-first approach with breakpoints
- **Accessibility**: ARIA labels and keyboard navigation
- **Animations**: Smooth transitions and hover effects
- **Glass Morphism**: Modern frosted glass effects

## Data Flow

### Frontend Data Flow
1. React components render static content
2. TanStack Query manages server state (prepared for future API calls)
3. Form submissions handled by React Hook Form
4. Client-side routing via Wouter
5. Responsive design adapts to screen sizes

### Backend Data Flow
1. Express server handles HTTP requests
2. Routes defined in `/api` prefix structure
3. Drizzle ORM manages database connections
4. In-memory storage for development (easily replaceable)
5. Session management for user authentication

### Token Economics
- **Total Supply**: 100 billion BAM tokens
- **Distribution**: 6 categories with specific percentages
- **Ecosystem Growth**: 25% for platform development
- **Public Sale**: 20% for community distribution
- **Treasury**: 20% for operational reserves

## External Dependencies

### Frontend Dependencies
- **UI Components**: Radix UI primitives for accessibility
- **Styling**: Tailwind CSS for utility-first styling
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React for consistent iconography
- **Forms**: React Hook Form with Hookform/resolvers

### Backend Dependencies
- **Database**: Neon Database (PostgreSQL-compatible)
- **Session Storage**: Connect-pg-simple for PostgreSQL sessions
- **Development**: TSX for TypeScript execution
- **Build Tools**: ESBuild for production bundling

### Development Tools
- **Replit Integration**: Special handling for Replit development environment
- **Hot Reload**: Vite dev server with Express integration
- **TypeScript**: Full type checking and IntelliSense
- **Path Aliases**: Simplified imports with @ aliases

## Deployment Strategy

### Development
- **Local Development**: Vite dev server with Express backend
- **Hot Reload**: Automatic refresh on code changes
- **Environment Variables**: DATABASE_URL for database connection
- **Replit Support**: Special configuration for Replit environment

### Production Build
- **Frontend**: Vite builds optimized static assets
- **Backend**: ESBuild creates bundled Node.js application
- **Database**: Drizzle handles migrations and schema updates
- **Static Files**: Express serves built React application

### Database Management
- **Migrations**: Stored in `/migrations` directory
- **Schema**: Defined in `/shared/schema.ts`
- **Push Command**: `npm run db:push` for schema updates
- **Connection**: Environment-based database URL configuration

### Future Scalability
- **Modular Architecture**: Easy to add new features and routes
- **Type Safety**: Prevents runtime errors in production
- **Component Reusability**: Shared UI components across features
- **Database Flexibility**: Drizzle ORM supports multiple databases
- **API-Ready**: Backend structure prepared for REST API expansion