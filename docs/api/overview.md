# API Overview

The BAM Ecosystem API provides comprehensive access to all platform functionality, enabling developers to integrate with the ecosystem and build custom applications.

## Base URL

**Production**: `https://bam-ecosystem.com/api`  
**Development**: `http://localhost:5000/api`

## Authentication

The BAM Ecosystem API uses wallet-based authentication for secure access to protected endpoints.

### Authentication Flow

1. **Connect Wallet**: User connects their Web3 wallet
2. **Sign Message**: User signs a verification message
3. **Session Creation**: Server creates authenticated session
4. **API Access**: Use session cookie for authenticated requests

### Authentication Headers

```http
Cookie: connect.sid=s%3A[session-id]
```

## Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {} // Optional additional error details
  }
}
```

## Rate Limiting

The API implements multi-tier rate limiting to ensure fair usage and system stability.

### Rate Limits

| Endpoint Category | Limit | Window |
|------------------|--------|---------|
| General API | 100 requests | 15 minutes |
| AI Chat | 2 requests | 1 minute |
| AI Chat Daily | 50 requests | 24 hours |
| Conversations | 25 requests | 5 minutes |
| Authentication | 5 requests | 15 minutes |
| Username Changes | 3 requests | 1 hour |

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
X-RateLimit-Window: 900
```

## Error Handling

### Common Error Codes

| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | Authentication required |
| `FORBIDDEN` | Insufficient permissions |
| `RATE_LIMITED` | Rate limit exceeded |
| `VALIDATION_ERROR` | Input validation failed |
| `NOT_FOUND` | Resource not found |
| `INTERNAL_ERROR` | Server error occurred |

### Rate Limit Error Response

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Rate limit exceeded. Please wait 45 seconds before trying again.",
    "details": {
      "retryAfter": 45,
      "limit": 2,
      "window": 60,
      "category": "ai_chat"
    }
  }
}
```

## Pagination

List endpoints support cursor-based pagination for efficient data retrieval.

### Pagination Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | integer | Number of items to return (max 100) |
| `cursor` | string | Pagination cursor for next page |

### Pagination Response

```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "hasNext": true,
      "nextCursor": "eyJpZCI6MTIzNDU2Nzg5MH0=",
      "total": 150
    }
  }
}
```

## Data Validation

All API inputs are validated using Zod schemas for type safety and data integrity.

### Validation Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "issue": "Invalid email format"
    }
  }
}
```

## Content Types

### Request Content Types
- `application/json` - JSON request body
- `application/x-www-form-urlencoded` - Form data

### Response Content Types
- `application/json` - JSON response (default)
- `text/plain` - Plain text responses

## CORS Policy

The API supports Cross-Origin Resource Sharing (CORS) for browser-based applications.

### Allowed Origins
- `https://bam-ecosystem.com`
- `http://localhost:5000` (development)

### CORS Headers
```http
Access-Control-Allow-Origin: https://bam-ecosystem.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
```

## Security Headers

All responses include security headers for enhanced protection:

```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'
```

## API Versioning

Currently using version 1 of the API. Future versions will be supported through URL versioning:

- `v1` (current): `/api/`
- `v2` (future): `/api/v2/`

## Webhooks

Webhook support is planned for future releases to enable real-time event notifications.

### Planned Webhook Events
- Transaction completed
- Price alerts triggered
- System maintenance notifications
- Security alerts

## SDK and Libraries

Official SDKs are planned for popular programming languages:

### Planned SDKs
- **JavaScript/TypeScript**: Browser and Node.js support
- **Python**: Complete API client library
- **Go**: High-performance API client
- **Rust**: Type-safe API interactions

## OpenAPI Specification

A complete OpenAPI (Swagger) specification is available for API documentation and client generation:

**OpenAPI Spec**: `/api/docs/openapi.json`  
**Interactive Docs**: `/api/docs` (planned)

## Testing

### Test Environment
**Base URL**: `https://testnet.bam-ecosystem.com/api`

The test environment provides:
- Sandbox blockchain integration
- Mock data for testing
- Rate limit relaxation for development
- Debug endpoints for troubleshooting

### API Testing Tools

#### cURL Examples
```bash
# Health check
curl -X GET https://bam-ecosystem.com/api/health

# Get token prices
curl -X GET https://bam-ecosystem.com/api/prices/bnb
```

#### JavaScript Example
```javascript
const response = await fetch('https://bam-ecosystem.com/api/prices/bnb');
const data = await response.json();
console.log(data);
```

## Monitoring and Status

### Health Check Endpoint
```
GET /api/health
```

### Status Page
Real-time API status and performance metrics:  
**Status Page**: `https://status.bam-ecosystem.com`

### Uptime Targets
- **API Availability**: 99.9%
- **Response Time**: <200ms average
- **Error Rate**: <0.1%

## Support

### Documentation
- **API Reference**: Complete endpoint documentation
- **Code Examples**: Sample implementations
- **Integration Guides**: Step-by-step integration tutorials

### Developer Support
- **Discord Community**: Real-time developer support
- **GitHub Issues**: Bug reports and feature requests
- **Email Support**: `developers@bam-ecosystem.com`

---

This API overview provides the foundation for understanding how to interact with the BAM Ecosystem programmatically. Detailed endpoint documentation is available in the following sections.