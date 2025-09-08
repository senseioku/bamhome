# Getting Started

Welcome to the BAM Ecosystem! This guide will help you get started with setting up, developing, and using the platform.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Git**
- **PostgreSQL** (for local development)
- **Web3 Wallet** (MetaMask, Trust Wallet, etc.)

## Quick Start

### 1. Clone the Repository

```bash
git clone [repository-url]
cd bam-ecosystem
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Copy the example environment file and configure your settings:

```bash
cp .env.example .env
```

Required environment variables:

```bash
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/bam_ecosystem
PGDATABASE=bam_ecosystem
PGHOST=localhost
PGUSER=your_username
PGPASSWORD=your_password
PGPORT=5432

# Blockchain Configuration
VITE_CHAINSTACK_BSC_ENDPOINT=https://bsc-dataseed1.binance.org/
CHAINSTACK_BSC_ENDPOINT=https://bsc-dataseed1.binance.org/

# AI Integration
ANTHROPIC_API_KEY=your_anthropic_api_key
```

### 4. Database Setup

```bash
# Push schema to database
npm run db:push

# Optional: Seed with initial data
npm run db:seed
```

### 5. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## Project Structure

```
bam-ecosystem/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── lib/           # Utilities and services
│   │   └── styles/        # Global styles
├── server/                # Backend Express application
│   ├── routes/           # API routes
│   ├── middleware/       # Express middleware
│   ├── services/         # Business logic
│   └── utils/            # Server utilities
├── shared/               # Shared types and schemas
│   └── schema.ts         # Database schema definitions
├── docs/                 # Documentation
└── public/               # Static assets
```

## First Steps

### 1. Connect Your Wallet

1. Navigate to the BAM Ecosystem homepage
2. Click "Connect Wallet" in the top navigation
3. Select your preferred wallet (MetaMask, Trust Wallet, etc.)
4. Approve the connection request
5. Switch to Binance Smart Chain if prompted

### 2. Create Your Profile

1. After connecting your wallet, you'll be prompted to create a username
2. Fill in required information (email, country)
3. Choose a unique username (can be changed once every 30 days)
4. Save your profile

### 3. Explore the Platform

- **BAM Swap**: Trade tokens with dynamic pricing
- **AI Chat**: Get assistance with crypto and general questions
- **Tokenomics**: Learn about BAM token distribution and vesting
- **Mining**: Access ApexMiner for additional rewards
- **VIP Access**: Explore premium features

## Development Workflow

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Building for Production

```bash
# Build the application
npm run build

# Preview production build
npm run preview
```

### Database Operations

```bash
# Generate migration
npm run db:generate

# Push schema changes
npm run db:push

# Force push schema changes
npm run db:push --force

# Open database studio
npm run db:studio
```

## Troubleshooting

### Common Issues

**Port Already in Use**
```bash
# Kill process on port 5000
npx kill-port 5000
```

**Database Connection Issues**
- Ensure PostgreSQL is running
- Check DATABASE_URL format
- Verify database exists

**Wallet Connection Problems**
- Clear browser cache
- Disable other wallet extensions temporarily
- Ensure you're on the correct network (BSC)

### Getting Help

- Check the [Troubleshooting Guide](troubleshooting/common-issues.md)
- Review [API Documentation](api/overview.md)
- Visit our [Support Page](troubleshooting/support.md)

## Next Steps

- [Platform Overview](platform-overview.md) - Learn about all platform features
- [User Guides](guides/) - Detailed guides for each feature
- [API Reference](api/) - Complete API documentation
- [Architecture](architecture/) - Technical system overview

---

Ready to build and multiply wealth with BAM Ecosystem? Let's get started! 🚀