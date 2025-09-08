# Swap API

The Swap API provides programmatic access to the BAM Swap functionality, enabling token trading, price queries, and balance management.

## Endpoints

### Get Token Prices

Retrieve current token prices from various sources.

#### Get BNB Price
```
GET /api/prices/bnb
```

**Response:**
```json
{
  "success": true,
  "data": {
    "bnbPrice": "320.45",
    "source": "chainlink",
    "timestamp": "2025-01-15T10:30:00.000Z",
    "fallbackUsed": false
  }
}
```

#### Get All Prices
```
GET /api/prices
```

**Response:**
```json
{
  "success": true,
  "data": {
    "BNB": "320.45",
    "USDT": "1.00",
    "USDB": "1.00",
    "BAM": "1.25",
    "lastUpdated": "2025-01-15T10:30:00.000Z"
  }
}
```

### Contract Information

Get smart contract data and configuration.

#### Get Contract Data
```
GET /api/swap/contract-data
```

**Response:**
```json
{
  "success": true,
  "data": {
    "bamPrice": "1.000000000",
    "minPurchase": "2",
    "maxPurchase": "5",
    "bamPerUSDT": "1",
    "isPaused": false,
    "lastUpdated": "2025-01-15T10:30:00.000Z"
  }
}
```

#### Get Contract Balances
```
GET /api/swap/balances
```

**Response:**
```json
{
  "success": true,
  "data": {
    "BNB": "0.0111",
    "USDT": "519.406317999998182031",
    "USDB": "499490.598682000001817969",
    "BAM": "8684600000.000020479488",
    "lastUpdated": "2025-01-15T10:30:00.000Z"
  }
}
```

### Token Information

Retrieve information about supported tokens.

#### Get BAM Holder Count
```
GET /api/bam/holders
```

**Response:**
```json
{
  "success": true,
  "data": {
    "holderCount": 1145,
    "contractAddress": "0xa779f03b752fa2442e6a23f145b007f2160f9a7d",
    "lastUpdated": "2025-01-15T10:30:00.000Z",
    "source": "BSCScan Web Scraping"
  }
}
```

#### Get Token Details
```
GET /api/tokens/:symbol
```

**Parameters:**
- `symbol` (string): Token symbol (BNB, USDT, USDB, BAM)

**Response:**
```json
{
  "success": true,
  "data": {
    "symbol": "BAM",
    "name": "Build and Multiply",
    "contractAddress": "0xa779f03b752fa2442e6a23f145b007f2160f9a7d",
    "decimals": 18,
    "network": "BSC",
    "isActive": true
  }
}
```

### Swap Calculations

Calculate swap amounts and fees before executing transactions.

#### Calculate Swap Quote
```
POST /api/swap/quote
```

**Request Body:**
```json
{
  "fromToken": "BNB",
  "toToken": "BAM",
  "amount": "1.5",
  "slippage": "0.5"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "inputAmount": "1.5",
    "outputAmount": "480.675",
    "exchangeRate": "320.45",
    "priceImpact": "0.1",
    "minimumReceived": "478.267",
    "fees": {
      "swapFee": "0.003",
      "gasFee": "0.002"
    },
    "route": ["BNB", "BAM"],
    "validUntil": "2025-01-15T10:35:00.000Z"
  }
}
```

### Transaction Validation

Validate swap parameters before transaction submission.

#### Validate Swap Parameters
```
POST /api/swap/validate
```

**Request Body:**
```json
{
  "fromToken": "BNB",
  "toToken": "BAM",
  "amount": "2.5",
  "walletAddress": "0x742d35cc6e3f77b2d6ee1e7e5c9e9b5d5f1a2b3c"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "checks": {
      "amountInRange": true,
      "sufficientBalance": true,
      "contractActive": true,
      "tokenSupported": true
    },
    "warnings": [],
    "estimatedGas": "150000"
  }
}
```

### Gas Estimation

Get gas estimates for swap transactions.

#### Estimate Gas Fees
```
POST /api/swap/estimate-gas
```

**Request Body:**
```json
{
  "fromToken": "BNB",
  "toToken": "BAM",
  "amount": "2.0",
  "walletAddress": "0x742d35cc6e3f77b2d6ee1e7e5c9e9b5d5f1a2b3c"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "gasLimit": "150000",
    "gasPrice": "5000000000",
    "gasCost": "0.00075",
    "gasCostUSD": "0.24",
    "priorityFee": "2000000000",
    "maxFeePerGas": "7000000000"
  }
}
```

## Error Responses

### Validation Errors

#### Invalid Token Symbol
```json
{
  "success": false,
  "error": {
    "code": "INVALID_TOKEN",
    "message": "Unsupported token symbol",
    "details": {
      "symbol": "INVALID",
      "supportedTokens": ["BNB", "USDT", "USDB", "BAM"]
    }
  }
}
```

#### Amount Out of Range
```json
{
  "success": false,
  "error": {
    "code": "AMOUNT_OUT_OF_RANGE",
    "message": "Transaction amount outside allowed limits",
    "details": {
      "amount": "1.0",
      "minAmount": "2.0",
      "maxAmount": "5.0",
      "currency": "BNB"
    }
  }
}
```

### Service Errors

#### Contract Paused
```json
{
  "success": false,
  "error": {
    "code": "CONTRACT_PAUSED",
    "message": "Swap contract is currently paused for maintenance",
    "details": {
      "pausedAt": "2025-01-15T09:00:00.000Z",
      "estimatedResume": "2025-01-15T11:00:00.000Z"
    }
  }
}
```

#### Insufficient Liquidity
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_LIQUIDITY",
    "message": "Insufficient contract liquidity for this swap",
    "details": {
      "requestedAmount": "1000.0",
      "availableLiquidity": "800.0",
      "token": "BAM"
    }
  }
}
```

## Rate Limiting

Swap API endpoints have specific rate limits:

| Endpoint | Limit | Window |
|----------|--------|---------|
| `/api/prices/*` | 60 requests | 1 minute |
| `/api/swap/quote` | 30 requests | 1 minute |
| `/api/swap/validate` | 20 requests | 1 minute |
| `/api/bam/holders` | 10 requests | 5 minutes |

## WebSocket Support

Real-time price updates are available via WebSocket connection:

### Connection
```javascript
const ws = new WebSocket('wss://bam-ecosystem.com/api/ws/prices');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Price update:', data);
};
```

### Price Update Message
```json
{
  "type": "price_update",
  "data": {
    "BNB": "320.45",
    "USDT": "1.00",
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

## Integration Examples

### JavaScript Integration

```javascript
class BAMSwapAPI {
  constructor(baseURL = 'https://bam-ecosystem.com/api') {
    this.baseURL = baseURL;
  }

  async getBNBPrice() {
    const response = await fetch(`${this.baseURL}/prices/bnb`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error.message);
    }
    
    return data.data.bnbPrice;
  }

  async getSwapQuote(fromToken, toToken, amount) {
    const response = await fetch(`${this.baseURL}/swap/quote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fromToken,
        toToken,
        amount: amount.toString(),
        slippage: '0.5'
      }),
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error.message);
    }
    
    return data.data;
  }
}

// Usage
const api = new BAMSwapAPI();
const price = await api.getBNBPrice();
const quote = await api.getSwapQuote('BNB', 'BAM', 2.5);
```

### Python Integration

```python
import requests
import json
from typing import Dict, Any

class BAMSwapAPI:
    def __init__(self, base_url: str = 'https://bam-ecosystem.com/api'):
        self.base_url = base_url
    
    def get_bnb_price(self) -> float:
        response = requests.get(f'{self.base_url}/prices/bnb')
        data = response.json()
        
        if not data['success']:
            raise Exception(data['error']['message'])
        
        return float(data['data']['bnbPrice'])
    
    def get_swap_quote(self, from_token: str, to_token: str, amount: float) -> Dict[str, Any]:
        payload = {
            'fromToken': from_token,
            'toToken': to_token,
            'amount': str(amount),
            'slippage': '0.5'
        }
        
        response = requests.post(
            f'{self.base_url}/swap/quote',
            headers={'Content-Type': 'application/json'},
            data=json.dumps(payload)
        )
        
        data = response.json()
        
        if not data['success']:
            raise Exception(data['error']['message'])
        
        return data['data']

# Usage
api = BAMSwapAPI()
price = api.get_bnb_price()
quote = api.get_swap_quote('BNB', 'BAM', 2.5)
```

## Testing

### Test Data

Use these test values for development:

```json
{
  "testWalletAddress": "0x742d35cc6e3f77b2d6ee1e7e5c9e9b5d5f1a2b3c",
  "testAmounts": {
    "small": "2.0",
    "medium": "3.5",
    "large": "5.0"
  },
  "expectedGasLimit": 150000
}
```

### Mock Responses

Development environment provides consistent mock data for testing.

---

The Swap API provides comprehensive access to all trading functionality while maintaining security and performance standards. Use this API to build custom trading interfaces or integrate BAM Swap functionality into your applications.