# Presale 2 Configuration Guide

## Overview
This guide will help you update the BAM Swap contract for Presale 2 with the new pricing and purchase limits.

## New Presale 2 Settings
- **BAM Price**: $0.000002 USDT (20x increase from $0.0000001)
- **Purchase Amount**: Exactly 2 USDT per wallet (up from 1 USDT)
- **BAM Received**: 1,000,000 BAM per purchase (down from 10,000,000)
- **Revenue Increase**: 400% more revenue per sale ($2 vs $0.50 in Presale 1)

## Price Calculation
```
Current Presale 1: 1 USDT = 10,000,000 BAM ($0.0000001 per BAM)
New Presale 2:     2 USDT = 1,000,000 BAM  ($0.000002 per BAM)

Price increase: 20x higher per token
Revenue increase: 4x higher per sale
```

## Execution Steps

### 1. Prepare Environment
```bash
cd contracts
npm install
```

### 2. Verify .env Configuration
Ensure your `.env` file contains:
```env
PRIVATE_KEY=your_private_key_here
BSCSCAN_API_KEY=your_bscscan_api_key_here
```

### 3. Run Price Update Script
```bash
node update-presale2-prices.js
```

## What the Script Does

### Contract Function Calls:
1. **`updateBAMPrice(2000000000000000)`**
   - Changes BAM price from 1e11 to 2e15
   - Makes BAM 20x more expensive
   - Users get 1M BAM for 2 USDT instead of 10M BAM for 1 USDT

2. **`updatePurchaseLimits(2000000, 2000000)`**
   - Sets minimum purchase to 2 USDT
   - Sets maximum purchase to 2 USDT
   - Enforces exactly 2 USDT per wallet

## Expected Output
```
🚀 Starting Presale 2 Configuration...

📝 Owner Address: 0x...
📍 Contract Address: 0x2D2F3bD3D6C5a1cCE37211F4385D92F6F1DF0F86

📊 Presale 2 Configuration:
   • BAM Price: $0.000002 USDT (was $0.0000001)
   • Price Increase: 20x higher
   • Min Purchase: 2 USDT (was 1 USDT)
   • Max Purchase: 2 USDT (was 1 USDT)
   • Tokens per 2 USDT: 1,000,000 BAM (was 10,000,000)

⛽ Estimating gas costs...
💰 Updating BAM Price to $0.000002...
   ✅ Price Updated! TX: 0x...

💳 Updating Purchase Limits to 2 USDT...
   ✅ Limits Updated! TX: 0x...

🎉 PRESALE 2 CONFIGURATION COMPLETE!
```

## Verification

After running the script, verify the changes:

1. **Check BAM Price**: Users should get 1,000,000 BAM for 2 USDT
2. **Check Purchase Limits**: Only 2 USDT purchases should be allowed
3. **Test Purchase**: Make a test purchase to confirm new pricing

## Frontend Updates Needed

The frontend will automatically adapt to the new contract settings:
- Purchase buttons will show 2 USDT requirement
- BAM amount calculations will show 1,000,000 BAM per purchase
- Presale 2 messaging will activate

## Revenue Impact

**Presale 1**: 1 USDT → 10,000,000 BAM
**Presale 2**: 2 USDT → 1,000,000 BAM

- 20x higher price per token
- 4x higher revenue per wallet
- More exclusive, premium pricing
- Better positioning for DEX launch

## Security Notes

- Only the contract owner can call these functions
- Changes are immediate and permanent
- Test on a single wallet before announcing
- Monitor contract balance to ensure sufficient BAM tokens

## Next Steps

1. Run the price update script
2. Update website messaging to "Presale 2"
3. Announce new pricing to community
4. Monitor sales and community response
5. Plan for eventual DEX listing at even higher prices

---

**Ready to launch Presale 2 with premium pricing! 🚀**