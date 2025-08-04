import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import helmet from 'helmet';
import { body, validationResult } from 'express-validator';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import cors from 'cors';
import type { Request, Response, NextFunction } from 'express';

// Rate limiting configurations
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Conservative limit - 100 requests per 15 minutes per IP
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes'
    });
  }
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 auth requests per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  skipSuccessfulRequests: true,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Authentication rate limit exceeded',
      message: 'Too many authentication attempts from this IP, please try again later.',
      retryAfter: '15 minutes'
    });
  }
});

export const chatRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3, // Conservative limit - 3 chat messages per minute to protect API credits
  message: {
    error: 'Chat rate limit exceeded',
    message: 'Too many chat messages, please slow down to preserve API resources.',
    retryAfter: '1 minute'
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Chat rate limit exceeded',
      message: 'Too many chat messages, please slow down to preserve API resources.',
      retryAfter: '1 minute'
    });
  }
});

// Separate, more restrictive rate limit specifically for AI API calls
export const aiApiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute  
  max: 2, // Very conservative - only 2 AI API calls per minute per IP
  message: {
    error: 'AI API rate limit exceeded',
    message: 'Please wait before sending another message to preserve API credits.',
    retryAfter: '1 minute'
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'AI API rate limit exceeded', 
      message: 'Please wait before sending another message to preserve API credits.',
      retryAfter: '1 minute'
    });
  }
});

// Daily rate limit for AI API calls to prevent credit exhaustion
export const dailyAiRateLimit = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 50, // Maximum 50 AI messages per day per IP
  message: {
    error: 'Daily AI limit reached',
    message: 'Daily AI message limit reached. Please try again tomorrow.',
    retryAfter: '24 hours'
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Daily AI limit reached',
      message: 'Daily AI message limit reached. Please try again tomorrow.',
      retryAfter: '24 hours'
    });
  }
});

export const usernameRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 username creation attempts per hour
  message: {
    error: 'Username creation rate limit exceeded',
    message: 'Too many username creation attempts, please try again later.',
    retryAfter: '1 hour'
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Username creation rate limit exceeded',
      message: 'Too many username creation attempts, please try again later.',
      retryAfter: '1 hour'
    });
  }
});

// Slow down middleware for progressive delays
export const progressiveSlowDown = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // Allow 50 requests per windowMs without delay
  delayMs: () => 500, // Add 500ms delay per request after delayAfter
  maxDelayMs: 20000, // Maximum delay of 20 seconds
  validate: { delayMs: false } // Disable warning
});

// Security headers with Helmet
export const securityHeaders = helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
      fontSrc: ["'self'", "fonts.gstatic.com"],
      scriptSrc: ["'self'", "'unsafe-eval'"], // Allow eval for production builds
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "https:"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      workerSrc: ["'self'"],
    },
  } : {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
      fontSrc: ["'self'", "fonts.gstatic.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Allow inline scripts for Vite dev
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "wss:", "https:", "ws:", "http:"], // Allow WebSocket for HMR
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      workerSrc: ["'self'", "blob:"],
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for Web3 compatibility
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// CORS configuration
export const corsOptions = cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.com', 'https://www.your-domain.com']
    : ['http://localhost:3000', 'http://localhost:5000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset']
});

// Input validation schemas
export const usernameValidation = [
  body('username')
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be 3-20 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores')
    .custom(async (value) => {
      // Additional checks for prohibited usernames
      const prohibited = ['admin', 'root', 'system', 'api', 'support', 'help', 'bam', 'bamtoken'];
      if (prohibited.includes(value.toLowerCase())) {
        throw new Error('This username is not allowed');
      }
      return true;
    }),
  body('displayName')
    .optional()
    .isLength({ max: 30 })
    .withMessage('Display name must be less than 30 characters')
    .trim()
    .escape()
];

export const chatValidation = [
  body('message')
    .isLength({ min: 1, max: 4000 })
    .withMessage('Message must be 1-4000 characters')
    .trim(),
  body('category')
    .optional()
    .isIn(['crypto', 'research', 'learn', 'general'])
    .withMessage('Invalid category'),
  body('conversationHistory')
    .optional()
    .isArray()
    .withMessage('Conversation history must be an array')
];

// Validation error handler
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(error => ({
        field: 'path' in error ? error.path : 'unknown',
        message: error.msg
      }))
    });
  }
  next();
};

// Sanitization middleware
export const sanitizeInput = [
  mongoSanitize(), // Prevent NoSQL injection
  hpp() // Prevent HTTP Parameter Pollution
];

// Request logging for security monitoring
export const securityLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const originalSend = res.send;
  
  res.send = function(body) {
    const duration = Date.now() - start;
    const clientIp = req.ip || 'unknown';
    
    // Log suspicious activities
    if (res.statusCode === 429 || res.statusCode === 401 || res.statusCode === 403) {
      console.warn(`[SECURITY] ${req.method} ${req.path} - ${res.statusCode} - ${clientIp} - ${duration}ms`);
    }
    
    // Log slow requests (potential DoS)
    if (duration > 5000) {
      console.warn(`[PERFORMANCE] Slow request: ${req.method} ${req.path} - ${duration}ms - ${clientIp}`);
    }
    
    return originalSend.call(this, body);
  };
  
  next();
};

// Enhanced authentication middleware with additional security checks
export const enhancedAuth = (req: Request, res: Response, next: NextFunction) => {
  // Check for suspicious patterns
  const userAgent = req.get('User-Agent') || '';
  const suspiciousPatterns = [
    /bot/i, /crawler/i, /spider/i, /scraper/i,
    /curl/i, /wget/i, /python/i, /java/i
  ];
  
  if (suspiciousPatterns.some(pattern => pattern.test(userAgent))) {
    console.warn(`[SECURITY] Suspicious User-Agent: ${userAgent} - IP: ${req.ip}`);
    return res.status(403).json({
      error: 'Access denied',
      message: 'Suspicious activity detected'
    });
  }
  
  // Check for required headers
  if (!req.get('Origin') && !req.get('Referer')) {
    console.warn(`[SECURITY] Missing Origin/Referer headers - IP: ${req.ip}`);
    return res.status(403).json({
      error: 'Access denied',
      message: 'Invalid request origin'
    });
  }
  
  next();
};

// Enhanced wallet address validation helper
export const isValidWalletAddress = (address: string): boolean => {
  if (!address) return false;
  const normalized = address.toLowerCase();
  return /^0x[a-f0-9]{40}$/.test(normalized);
};

// Normalize wallet address to lowercase
export const normalizeWalletAddress = (address: string): string => {
  return address?.toLowerCase() || '';
};

// Enhanced wallet address validation - accepts both uppercase and lowercase
export const walletValidation = [
  body('walletAddress')
    .custom((value) => {
      if (!isValidWalletAddress(value)) {
        throw new Error('Invalid wallet address format');
      }
      return true;
    })
    .withMessage('Invalid wallet address format')
];

// IP-based abuse detection
const ipAttempts = new Map<string, { count: number; lastAttempt: number; blocked: boolean }>();

export const abuseDetection = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || 'unknown';
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 hour window
  const maxAttempts = 20; // Max 20 failed attempts per hour
  const blockDuration = 24 * 60 * 60 * 1000; // 24 hour block
  
  let attempts = ipAttempts.get(ip) || { count: 0, lastAttempt: now, blocked: false };
  
  // Reset counter if window expired
  if (now - attempts.lastAttempt > windowMs) {
    attempts = { count: 0, lastAttempt: now, blocked: false };
  }
  
  // Check if IP is blocked
  if (attempts.blocked && now - attempts.lastAttempt < blockDuration) {
    return res.status(403).json({
      error: 'IP blocked',
      message: 'Your IP has been temporarily blocked due to suspicious activity',
      retryAfter: '24 hours'
    });
  }
  
  // Reset block if block duration expired
  if (attempts.blocked && now - attempts.lastAttempt >= blockDuration) {
    attempts.blocked = false;
    attempts.count = 0;
  }
  
  // Track failed attempts
  res.on('finish', () => {
    if (res.statusCode === 401 || res.statusCode === 403 || res.statusCode === 429) {
      attempts.count++;
      attempts.lastAttempt = now;
      
      if (attempts.count >= maxAttempts) {
        attempts.blocked = true;
        console.error(`[SECURITY] IP ${ip} blocked due to ${attempts.count} failed attempts`);
      }
      
      ipAttempts.set(ip || 'unknown', attempts);
    }
  });
  
  next();
};

// Clean up old IP attempt records periodically
setInterval(() => {
  const now = Date.now();
  const cleanupAge = 24 * 60 * 60 * 1000; // 24 hours
  
  Array.from(ipAttempts.entries()).forEach(([ip, attempts]) => {
    if (now - attempts.lastAttempt > cleanupAge && !attempts.blocked) {
      ipAttempts.delete(ip);
    }
  });
}, 60 * 60 * 1000); // Run cleanup every hour