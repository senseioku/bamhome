# AI Chat API

The AI Chat API provides access to BAM AIChat functionality, enabling AI-powered conversations, user profile management, and chat history operations.

## Authentication Required

All AI Chat API endpoints require wallet-based authentication. Users must connect their wallet and create a profile before accessing AI features.

## Endpoints

### User Profile Management

#### Create User Profile
```
POST /api/users
```

**Request Body:**
```json
{
  "username": "crypto_trader_123",
  "email": "user@example.com",
  "country": "United States",
  "displayName": "Crypto Trader"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "crypto_trader_123",
    "walletAddress": "0x742d35cc6e3f77b2d6ee1e7e5c9e9b5d5f1a2b3c",
    "email": "user@example.com",
    "country": "United States",
    "displayName": "Crypto Trader",
    "createdAt": "2025-01-15T10:30:00.000Z",
    "lastUsernameChange": null
  }
}
```

#### Get User Profile
```
GET /api/users/me
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "crypto_trader_123",
    "walletAddress": "0x742d35cc6e3f77b2d6ee1e7e5c9e9b5d5f1a2b3c",
    "email": "user@example.com",
    "country": "United States",
    "displayName": "Crypto Trader",
    "createdAt": "2025-01-15T10:30:00.000Z",
    "lastUsernameChange": null,
    "canChangeUsername": true
  }
}
```

#### Update User Profile
```
PUT /api/users/me
```

**Request Body:**
```json
{
  "username": "new_username_456",
  "email": "newemail@example.com",
  "country": "Canada",
  "displayName": "New Display Name"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "new_username_456",
    "email": "newemail@example.com",
    "country": "Canada",
    "displayName": "New Display Name",
    "lastUsernameChange": "2025-01-15T10:30:00.000Z",
    "canChangeUsername": false
  }
}
```

#### Check Username Availability
```
GET /api/users/username-available/:username
```

**Parameters:**
- `username` (string): Username to check

**Response:**
```json
{
  "success": true,
  "data": {
    "available": true,
    "username": "available_username"
  }
}
```

### Chat Operations

#### Send Chat Message
```
POST /api/chat
```

**Request Body:**
```json
{
  "message": "What are the benefits of staking BAM tokens?",
  "conversationId": 123 // Optional: omit to start new conversation
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "response": "Staking BAM tokens offers several benefits: 1. Earn passive rewards...",
    "conversationId": 123,
    "messageId": 456,
    "timestamp": "2025-01-15T10:30:00.000Z",
    "tokensUsed": 150,
    "responseTime": 1.2
  }
}
```

#### Get Conversation History
```
GET /api/chat/conversations/:conversationId
```

**Parameters:**
- `conversationId` (integer): Conversation ID

**Query Parameters:**
- `limit` (integer, optional): Number of messages to return (default: 50)
- `cursor` (string, optional): Pagination cursor

**Response:**
```json
{
  "success": true,
  "data": {
    "conversation": {
      "id": 123,
      "title": "BAM Token Staking Discussion",
      "createdAt": "2025-01-15T10:00:00.000Z",
      "updatedAt": "2025-01-15T10:30:00.000Z"
    },
    "messages": [
      {
        "id": 456,
        "role": "user",
        "content": "What are the benefits of staking BAM tokens?",
        "timestamp": "2025-01-15T10:30:00.000Z"
      },
      {
        "id": 457,
        "role": "assistant",
        "content": "Staking BAM tokens offers several benefits...",
        "timestamp": "2025-01-15T10:30:15.000Z"
      }
    ],
    "pagination": {
      "hasNext": false,
      "nextCursor": null,
      "total": 2
    }
  }
}
```

#### List User Conversations
```
GET /api/chat/conversations
```

**Query Parameters:**
- `limit` (integer, optional): Number of conversations to return (default: 10)
- `cursor` (string, optional): Pagination cursor

**Response:**
```json
{
  "success": true,
  "data": {
    "conversations": [
      {
        "id": 123,
        "title": "BAM Token Staking Discussion",
        "lastMessage": "Staking BAM tokens offers several benefits...",
        "messageCount": 8,
        "createdAt": "2025-01-15T10:00:00.000Z",
        "updatedAt": "2025-01-15T10:30:00.000Z"
      },
      {
        "id": 124,
        "title": "DeFi Investment Strategies",
        "lastMessage": "Diversification is key to managing risk...",
        "messageCount": 12,
        "createdAt": "2025-01-15T09:00:00.000Z",
        "updatedAt": "2025-01-15T09:45:00.000Z"
      }
    ],
    "pagination": {
      "hasNext": false,
      "nextCursor": null,
      "total": 2
    }
  }
}
```

#### Delete Conversation
```
DELETE /api/chat/conversations/:conversationId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "deleted": true,
    "conversationId": 123
  }
}
```

### Usage Statistics

#### Get User Usage Stats
```
GET /api/chat/usage
```

**Response:**
```json
{
  "success": true,
  "data": {
    "today": {
      "messagesUsed": 15,
      "messagesRemaining": 35,
      "resetTime": "2025-01-16T00:00:00.000Z"
    },
    "currentMinute": {
      "messagesUsed": 1,
      "messagesRemaining": 1,
      "resetTime": "2025-01-15T10:31:00.000Z"
    },
    "conversations": {
      "total": 8,
      "limit": 10,
      "canCreate": true
    },
    "rateLimits": {
      "aiCalls": {
        "perMinute": 2,
        "perDay": 50
      },
      "conversations": {
        "per5Minutes": 25
      }
    }
  }
}
```

## Error Responses

### Authentication Errors

#### Profile Not Found
```json
{
  "success": false,
  "error": {
    "code": "PROFILE_NOT_FOUND",
    "message": "User profile not found. Please create a profile first.",
    "details": {
      "walletAddress": "0x742d35cc6e3f77b2d6ee1e7e5c9e9b5d5f1a2b3c"
    }
  }
}
```

#### Wallet Not Connected
```json
{
  "success": false,
  "error": {
    "code": "WALLET_NOT_CONNECTED",
    "message": "Please connect your wallet to access AI chat features.",
    "details": {
      "requiresWallet": true
    }
  }
}
```

### Rate Limiting Errors

#### AI Chat Rate Limit
```json
{
  "success": false,
  "error": {
    "code": "AI_RATE_LIMITED",
    "message": "You've reached your AI chat limit. Please wait 45 seconds before sending another message.",
    "details": {
      "retryAfter": 45,
      "limit": 2,
      "window": 60,
      "type": "ai_chat_per_minute"
    }
  }
}
```

#### Daily Limit Exceeded
```json
{
  "success": false,
  "error": {
    "code": "DAILY_LIMIT_EXCEEDED",
    "message": "You've reached your daily AI chat limit of 50 messages. Limit resets at midnight UTC.",
    "details": {
      "limit": 50,
      "resetTime": "2025-01-16T00:00:00.000Z",
      "type": "ai_chat_daily"
    }
  }
}
```

### Validation Errors

#### Username Already Taken
```json
{
  "success": false,
  "error": {
    "code": "USERNAME_TAKEN",
    "message": "This username is already taken. Please choose a different one.",
    "details": {
      "username": "taken_username",
      "suggestions": ["taken_username_1", "taken_username_2"]
    }
  }
}
```

#### Username Change Too Soon
```json
{
  "success": false,
  "error": {
    "code": "USERNAME_CHANGE_TOO_SOON",
    "message": "You can only change your username once every 30 days. You can change it again on February 14, 2025.",
    "details": {
      "lastChange": "2025-01-15T10:30:00.000Z",
      "nextAllowedChange": "2025-02-14T10:30:00.000Z",
      "waitDays": 30
    }
  }
}
```

#### Invalid Email Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email address format",
    "details": {
      "field": "email",
      "value": "invalid-email",
      "requirement": "Valid email address format"
    }
  }
}
```

### Service Errors

#### AI Service Unavailable
```json
{
  "success": false,
  "error": {
    "code": "AI_SERVICE_UNAVAILABLE",
    "message": "AI service is temporarily unavailable. Please try again in a few moments.",
    "details": {
      "service": "anthropic_claude",
      "estimatedRetry": "2025-01-15T10:35:00.000Z"
    }
  }
}
```

## Rate Limiting

AI Chat API has specific rate limits to ensure fair usage:

| Endpoint Category | Limit | Window |
|------------------|--------|---------|
| AI Chat Messages | 2 requests | 1 minute |
| AI Chat Daily | 50 requests | 24 hours |
| Conversations | 25 requests | 5 minutes |
| Profile Updates | 3 requests | 1 hour |
| General Chat API | 100 requests | 15 minutes |

## Conversation Management

### Conversation Limits
- **Maximum Active Conversations**: 10 per user
- **Message History**: Last 50 messages per conversation
- **Auto-cleanup**: Oldest conversations automatically archived when limit exceeded
- **Message Retention**: Messages retained for 90 days

### Conversation Titles
- Automatically generated based on conversation content
- Can be manually updated via profile management
- Used for conversation organization and search

## AI Response Quality

### Response Characteristics
- **Average Response Time**: 1-3 seconds
- **Context Awareness**: Maintains conversation context
- **Token Limit**: Approximately 4,000 tokens per response
- **Language Support**: Primarily English, with basic multilingual support

### Content Guidelines
- Crypto and DeFi expertise prioritized
- General knowledge assistance available
- Inappropriate content filtered
- Professional, helpful tone maintained

## Integration Examples

### JavaScript Integration

```javascript
class BAMChatAPI {
  constructor(baseURL = 'https://bam-ecosystem.com/api') {
    this.baseURL = baseURL;
  }

  async createProfile(profileData) {
    const response = await fetch(`${this.baseURL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(profileData),
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error.message);
    }
    return data.data;
  }

  async sendMessage(message, conversationId = null) {
    const response = await fetch(`${this.baseURL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        message,
        ...(conversationId && { conversationId })
      }),
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error.message);
    }
    return data.data;
  }

  async getConversations() {
    const response = await fetch(`${this.baseURL}/chat/conversations`, {
      credentials: 'include',
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error.message);
    }
    return data.data;
  }
}

// Usage
const chatAPI = new BAMChatAPI();

// Create profile
const profile = await chatAPI.createProfile({
  username: 'trader_123',
  email: 'trader@example.com',
  country: 'United States',
  displayName: 'Crypto Trader'
});

// Send message
const response = await chatAPI.sendMessage('What is the current BAM token price?');
console.log(response.response);

// Get conversations
const conversations = await chatAPI.getConversations();
console.log(conversations.conversations);
```

### Error Handling Example

```javascript
try {
  const response = await chatAPI.sendMessage('Hello AI!');
  console.log(response.response);
} catch (error) {
  if (error.message.includes('rate limit')) {
    console.log('Rate limited. Please wait before sending another message.');
  } else if (error.message.includes('profile not found')) {
    console.log('Please create a profile first.');
  } else {
    console.error('Unexpected error:', error.message);
  }
}
```

## Testing

### Test Profile Data
```json
{
  "username": "test_user_" + Date.now(),
  "email": "test@example.com",
  "country": "United States",
  "displayName": "Test User"
}
```

### Test Messages
```javascript
const testMessages = [
  "What is BAM token?",
  "How do I stake my tokens?",
  "What are the gas fees for swapping?",
  "Explain DeFi yield farming",
  "What's the current market sentiment?"
];
```

---

The AI Chat API provides comprehensive access to the BAM AIChat system while maintaining strict security, rate limiting, and quality standards. Use this API to integrate AI assistance into your applications or build custom chat interfaces.