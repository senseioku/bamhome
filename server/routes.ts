import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { aiService } from "./ai";
import { cryptoService } from "./cryptoService";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import cors from "cors";

export async function registerRoutes(app: Express): Promise<Server> {
  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https:"],
      },
    },
  }));
  
  app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.ALLOWED_ORIGINS?.split(',') || []
      : true,
    credentials: true
  }));

  // Rate limiting
  const chatRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Limit each wallet to 50 requests per windowMs
    message: { message: 'Too many chat requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      const walletAddress = req.headers['x-wallet-address'] as string;
      return walletAddress ? `wallet:${walletAddress}` : `ip:${req.ip}`;
    }
  });

  const generalRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes  
    max: 100, // General API limit
    message: { message: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use('/api/', generalRateLimit);
  app.use('/api/chat/', chatRateLimit);

  // Auth middleware
  await setupAuth(app);

  // Custom wallet-based authentication middleware with signature verification
  const walletAuth = async (req: any, res: any, next: any) => {
    try {
      const walletAddress = req.headers['x-wallet-address'] as string;
      const signature = req.headers['x-wallet-signature'] as string;
      
      if (!walletAddress) {
        return res.status(401).json({ message: 'Wallet address required' });
      }

      // In production, verify signature here
      // TODO: Implement proper wallet signature verification
      if (process.env.NODE_ENV === 'production' && !signature) {
        return res.status(401).json({ message: 'Wallet signature required' });
      }

      // Validate wallet address format
      if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
        return res.status(400).json({ message: 'Invalid wallet address format' });
      }

      // Get or create user based on wallet address
      let user = await storage.getUserByWallet(walletAddress.toLowerCase());
      if (!user) {
        user = await storage.upsertUser({
          walletAddress: walletAddress.toLowerCase(),
          isVerified: true,
          lastActive: new Date()
        });
      } else {
        // Update last active
        await storage.updateUserActivity(user.id);
      }

      req.user = { id: user.id, walletAddress: user.walletAddress };
      next();
    } catch (error) {
      console.error('Wallet auth error:', error);
      return res.status(500).json({ message: 'Authentication failed' });
    }
  };

  // Auth routes
  app.get('/api/auth/user', walletAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Input validation schemas
  const createConversationSchema = z.object({
    title: z.string().min(1).max(100),
    category: z.enum(['crypto', 'research', 'learn', 'general']).default('general')
  });

  const sendMessageSchema = z.object({
    content: z.string().min(1).max(4000)
  });

  // Chat routes with wallet authentication
  app.post('/api/chat/conversations', walletAuth, async (req: any, res) => {
    try {
      const validation = createConversationSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: 'Invalid input', 
          errors: validation.error.issues 
        });
      }

      const userId = req.user.id;
      const { title, category } = validation.data;

      const conversation = await storage.createConversation({
        userId,
        title: title || 'New Conversation',
        category,
      });

      res.json(conversation);
    } catch (error) {
      console.error('Create conversation error:', error);
      res.status(500).json({ message: 'Failed to create conversation' });
    }
  });

  app.get('/api/chat/conversations', walletAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const conversations = await storage.getConversations(userId);
      res.json(conversations);
    } catch (error) {
      console.error('Get conversations error:', error);
      res.status(500).json({ message: 'Failed to get conversations' });
    }
  });

  app.get('/api/chat/conversations/:id', walletAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const conversation = await storage.getConversation(id);
      
      if (!conversation) {
        return res.status(404).json({ message: 'Conversation not found' });
      }

      const messages = await storage.getMessages(id);
      res.json({ conversation, messages });
    } catch (error) {
      console.error('Get conversation error:', error);
      res.status(500).json({ message: 'Failed to get conversation' });
    }
  });

  app.post('/api/chat/conversations/:id/messages', walletAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const validation = sendMessageSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: 'Invalid message content', 
          errors: validation.error.issues 
        });
      }

      const { content } = validation.data;
      const userId = req.user.id;

      const conversation = await storage.getConversation(id);
      if (!conversation) {
        return res.status(404).json({ message: 'Conversation not found' });
      }

      // Create user message
      const userMessage = await storage.createMessage({
        conversationId: id,
        role: 'user',
        content: content.trim(),
      });

      // Get conversation history for AI context
      const messages = await storage.getMessages(id);
      const chatHistory = messages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }));

      // Generate AI response
      const aiResponse = await aiService.chat(chatHistory, conversation.category);

      // Create AI message
      const aiMessage = await storage.createMessage({
        conversationId: id,
        role: 'assistant',
        content: aiResponse.message,
        metadata: aiResponse.metadata,
      });

      // Update user activity
      await storage.updateUserActivity(userId);
      await storage.logUserActivity({
        userId,
        action: 'chat',
        metadata: { conversationId: id, category: conversation.category }
      });

      res.json({
        userMessage,
        aiMessage
      });

    } catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({ message: 'Failed to send message' });
    }
  });

  app.delete('/api/chat/conversations/:id', walletAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteConversation(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Delete conversation error:', error);
      res.status(500).json({ message: 'Failed to delete conversation' });
    }
  });

  // Crypto updates routes
  app.get('/api/crypto/updates', async (req, res) => {
    try {
      const { category, limit } = req.query;
      const updates = await storage.getCryptoUpdates(
        category as string,
        limit ? parseInt(limit as string) : undefined
      );
      res.json(updates);
    } catch (error) {
      console.error('Get crypto updates error:', error);
      res.status(500).json({ message: 'Failed to get crypto updates' });
    }
  });

  app.get('/api/crypto/highlights', async (req, res) => {
    try {
      const highlights = await storage.getHighlightedUpdates();
      res.json(highlights);
    } catch (error) {
      console.error('Get highlights error:', error);
      res.status(500).json({ message: 'Failed to get highlights' });
    }
  });

  app.get('/api/crypto/market', async (req, res) => {
    try {
      const marketData = await cryptoService.fetchMarketData();
      res.json(marketData);
    } catch (error) {
      console.error('Get market data error:', error);
      res.status(500).json({ message: 'Failed to get market data' });
    }
  });

  // Learning routes
  app.get('/api/learning/topics', async (req, res) => {
    try {
      const { category, difficulty } = req.query;
      const topics = await storage.getLearningTopics(
        category as string,
        difficulty as string
      );
      res.json(topics);
    } catch (error) {
      console.error('Get learning topics error:', error);
      res.status(500).json({ message: 'Failed to get learning topics' });
    }
  });

  app.get('/api/learning/topics/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const topic = await storage.getLearningTopic(id);
      
      if (!topic) {
        return res.status(404).json({ message: 'Topic not found' });
      }

      // Increment view count
      await storage.incrementTopicViews(id);

      res.json(topic);
    } catch (error) {
      console.error('Get learning topic error:', error);
      res.status(500).json({ message: 'Failed to get learning topic' });
    }
  });

  // User stats route
  app.get('/api/user/stats', walletAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      console.error('Get user stats error:', error);
      res.status(500).json({ message: 'Failed to get user stats' });
    }
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  const httpServer = createServer(app);
  return httpServer;
}