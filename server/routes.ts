import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { aiService } from "./ai";
import { db } from "./db";
import { cryptoService } from "./cryptoService";
import { monitoring } from "./monitoring";
import { 
  compressionMiddleware, 
  securityMiddleware, 
  timeoutMiddleware, 
  productionLogger,
  healthCheck,
  gracefulShutdown 
} from "./performance";
import { setupProductionOptimizations, queryOptimizer, ResponseOptimizer } from "./optimization";
import { 
  aiCircuitBreaker, 
  requestDeduplicator, 
  dbHealthMonitor, 
  autoScaler, 
  readinessChecker 
} from "./scalability";
import { z } from "zod";
import {
  generalRateLimit,
  authRateLimit,
  chatRateLimit,
  usernameRateLimit,
  progressiveSlowDown,
  securityHeaders,
  corsOptions,
  usernameValidation,
  chatValidation,
  handleValidationErrors,
  sanitizeInput,
  securityLogger,
  enhancedAuth,
  abuseDetection,
  walletValidation,
  isValidWalletAddress,
  normalizeWalletAddress
} from "./security";

export async function registerRoutes(app: Express): Promise<Server> {
  // Basic middleware stack for development
  app.use(compressionMiddleware);
  
  // Only essential security for development
  app.use(corsOptions);
  
  // Disable aggressive rate limiting and abuse detection in development
  if (process.env.NODE_ENV === 'production') {
    app.use(securityMiddleware);
    app.use(timeoutMiddleware(30000));
    app.use(productionLogger);
    app.use(autoScaler.middleware());
    app.use(securityHeaders);
    app.use(securityLogger);
    app.use(abuseDetection);
    app.use(progressiveSlowDown);
    app.use(generalRateLimit);
    app.use(sanitizeInput);
  }
  
  // Monitoring and optimization setup
  monitoring.setupMiddleware(app);
  healthCheck(app);
  setupProductionOptimizations(app);

  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Username management routes (simplified wallet-based auth)
  app.post('/api/user/username', 
    usernameRateLimit,
    usernameValidation,
    handleValidationErrors,
    async (req: any, res: any) => {
    try {
      const { username, displayName, email, country, walletAddress } = req.body;

      if (!isValidWalletAddress(walletAddress)) {
        return res.status(400).json({ message: "Valid wallet address is required" });
      }
      
      // Normalize wallet address for consistency
      const normalizedWallet = normalizeWalletAddress(walletAddress);

      if (!username || username.length < 3 || username.length > 20) {
        return res.status(400).json({ message: "Username must be 3-20 characters" });
      }

      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser && existingUser.walletAddress !== normalizedWallet) {
        return res.status(409).json({ message: "Username already taken" });
      }

      if (!email || !country) {
        return res.status(400).json({ message: "Email and country are required" });
      }

      const updatedUser = await storage.createUsername(normalizedWallet, username, displayName, email, country);
      res.json(updatedUser);
    } catch (error: unknown) {
      console.error("Error creating username:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to create username";
      res.status(500).json({ message: errorMessage });
    }
  });

  app.get('/api/user/username/check/:username', async (req, res) => {
    try {
      const { username } = req.params;
      const user = await storage.getUserByUsername(username);
      res.json({ available: !user });
    } catch (error: unknown) {
      console.error("Error checking username:", error);
      res.status(500).json({ message: "Failed to check username" });
    }
  });

  // Update username/profile route
  app.put('/api/user/profile', 
    usernameRateLimit,
    usernameValidation,
    handleValidationErrors,
    async (req: any, res: any) => {
    try {
      const { username, displayName, email, country, walletAddress } = req.body;

      if (!isValidWalletAddress(walletAddress)) {
        return res.status(400).json({ message: "Valid wallet address is required" });
      }
      
      const normalizedWallet = normalizeWalletAddress(walletAddress);

      // Get current user
      const currentUser = await storage.getUserByWallet(normalizedWallet);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if new username is available (if different from current)
      if (username && username !== currentUser.username) {
        // Check 30-day restriction for username changes
        if (currentUser.lastUsernameChange) {
          const daysSinceLastChange = Math.floor(
            (Date.now() - new Date(currentUser.lastUsernameChange).getTime()) / (1000 * 60 * 60 * 24)
          );
          
          if (daysSinceLastChange < 30) {
            const daysRemaining = 30 - daysSinceLastChange;
            const nextChangeDate = new Date(currentUser.lastUsernameChange);
            nextChangeDate.setDate(nextChangeDate.getDate() + 30);
            
            return res.status(429).json({
              error: "Username change limit reached",
              message: `You can change your username again in ${daysRemaining} days (${nextChangeDate.toLocaleDateString()}).`,
              retryAfter: `${daysRemaining} days`,
              nextAttempt: nextChangeDate.toISOString(),
              tip: "Username changes are limited to once every 30 days to maintain community stability."
            });
          }
        }

        const existingUser = await storage.getUserByUsername(username);
        if (existingUser && existingUser.walletAddress !== normalizedWallet) {
          return res.status(409).json({ message: "Username already taken" });
        }
      }

      const updatedUser = await storage.updateUserProfile(normalizedWallet, {
        username: username || currentUser.username,
        displayName: displayName || currentUser.displayName,
        ...(email && { email }),
        ...(country && { country }),
        // Only update lastUsernameChange if username actually changed
        ...(username && username !== currentUser.username && { lastUsernameChange: new Date() })
      });
      
      res.json(updatedUser);
    } catch (error: unknown) {
      console.error("Error updating profile:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to update profile";
      res.status(500).json({ message: errorMessage });
    }
  });

  // Chat routes (simplified wallet-based auth)
  app.post('/api/chat/conversations', 
    chatRateLimit,
    chatValidation,
    handleValidationErrors,
    async (req: any, res: any) => {
    try {
      const { title, category = 'general', walletAddress } = req.body;

      if (!isValidWalletAddress(walletAddress)) {
        return res.status(400).json({ message: "Valid wallet address is required" });
      }
      
      // Normalize wallet address for consistency
      const normalizedWallet = normalizeWalletAddress(walletAddress);

      // Get or create user by normalized wallet address
      let user = await storage.getUserByWallet(normalizedWallet);
      if (!user) {
        user = await storage.upsertUser({
          id: normalizedWallet,
          walletAddress: normalizedWallet,
          email: '',
          firstName: null,
          lastName: null,
          username: null,
          displayName: null,
          profileImageUrl: null
        });
      }

      const conversation = await storage.createConversation({
        userId: user.id,
        title: title || 'New Conversation',
        category,
      });

      res.json(conversation);
    } catch (error) {
      console.error('Create conversation error:', error);
      res.status(500).json({ message: 'Failed to create conversation' });
    }
  });

  app.get('/api/chat/conversations', async (req: any, res) => {
    try {
      const { walletAddress } = req.query;
      
      if (!isValidWalletAddress(walletAddress as string)) {
        return res.status(400).json({ message: "Valid wallet address is required" });
      }

      const normalizedWallet = normalizeWalletAddress(walletAddress as string);
      const user = await storage.getUserByWallet(normalizedWallet);
      if (!user) {
        return res.json([]); // Return empty array for new users
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      
      const conversations = await queryOptimizer.cachedQuery(
        `conversations:${user.id}:${page}:${limit}`,
        () => storage.getConversations(user.id)
      );
      
      const paginatedResult = ResponseOptimizer.paginate(conversations, page, limit);
      const optimizedData = ResponseOptimizer.compressResponse(paginatedResult);
      
      res.json(optimizedData);
    } catch (error) {
      console.error('Get conversations error:', error);
      res.status(500).json({ message: 'Failed to get conversations' });
    }
  });

  app.get('/api/chat/conversations/:id', async (req: any, res) => {
    try {
      const { id } = req.params;
      const { walletAddress } = req.query;
      
      if (!isValidWalletAddress(walletAddress as string)) {
        return res.status(400).json({ message: "Valid wallet address is required" });
      }

      const normalizedWallet = normalizeWalletAddress(walletAddress as string);
      const conversation = await storage.getConversation(id);
      
      if (!conversation) {
        return res.status(404).json({ message: 'Conversation not found' });
      }

      // Verify user owns this conversation
      const user = await storage.getUserByWallet(normalizedWallet);
      if (!user || conversation.userId !== user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const messages = await storage.getMessages(id);
      res.json({ conversation, messages });
    } catch (error) {
      console.error('Get conversation error:', error);
      res.status(500).json({ message: 'Failed to get conversation' });
    }
  });

  app.post('/api/chat/conversations/:id/messages', async (req: any, res) => {
    try {
      const { id } = req.params;
      const { content, walletAddress } = req.body;

      if (!isValidWalletAddress(walletAddress)) {
        return res.status(400).json({ message: "Valid wallet address is required" });
      }

      if (!content?.trim()) {
        return res.status(400).json({ message: 'Message content is required' });
      }

      const normalizedWallet = normalizeWalletAddress(walletAddress);
      const conversation = await storage.getConversation(id);
      if (!conversation) {
        return res.status(404).json({ message: 'Conversation not found' });
      }

      // Verify user owns this conversation
      const user = await storage.getUserByWallet(normalizedWallet);
      if (!user || conversation.userId !== user.id) {
        return res.status(403).json({ message: 'Access denied' });
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

      // Generate AI response with circuit breaker and deduplication
      const cacheKey = `ai_response:${id}:${content.substring(0, 50)}`;
      const aiResponse = await requestDeduplicator.deduplicate(cacheKey, async () => {
        return await aiCircuitBreaker.execute(() => 
          aiService.chat(chatHistory, conversation.category)
        );
      });

      // Create AI message
      const aiMessage = await storage.createMessage({
        conversationId: id,
        role: 'assistant',
        content: aiResponse.message,
        metadata: aiResponse.metadata,
      });

      // Update user activity
      await storage.updateUserActivity(user.id);
      await storage.logUserActivity({
        userId: user.id,
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

  app.delete('/api/chat/conversations/:id', async (req: any, res) => {
    try {
      const { id } = req.params;
      const { walletAddress } = req.body;
      
      if (!isValidWalletAddress(walletAddress)) {
        return res.status(400).json({ message: "Valid wallet address is required" });
      }

      const normalizedWallet = normalizeWalletAddress(walletAddress);
      const conversation = await storage.getConversation(id);
      if (!conversation) {
        return res.status(404).json({ message: 'Conversation not found' });
      }

      // Verify user owns this conversation
      const user = await storage.getUserByWallet(normalizedWallet);
      if (!user || conversation.userId !== user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }

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
  app.get('/api/user/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      console.error('Get user stats error:', error);
      res.status(500).json({ message: 'Failed to get user stats' });
    }
  });

  // Get user profile by wallet address
  app.get('/api/user/profile', async (req: any, res) => {
    try {
      const { walletAddress } = req.query;
      
      if (!walletAddress || !isValidWalletAddress(walletAddress)) {
        return res.status(400).json({ message: "Valid wallet address is required" });
      }

      const normalizedWallet = normalizeWalletAddress(walletAddress);
      const user = await storage.getUserByWallet(normalizedWallet);
      
      if (!user) {
        return res.status(404).json({ message: 'User profile not found' });
      }

      // Return user profile data
      res.json({
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        walletAddress: user.walletAddress,
        createdAt: user.createdAt
      });
    } catch (error) {
      console.error('Get user profile error:', error);
      res.status(500).json({ message: 'Failed to get user profile' });
    }
  });

  // Wallet verification route for BAM AIChat
  app.post('/api/wallet/verify',
    authRateLimit,
    enhancedAuth,
    walletValidation,
    handleValidationErrors,
    async (req: any, res: any) => {
    try {
      const { address, signature, message } = req.body;

      if (!address || !signature || !message) {
        return res.status(400).json({ 
          error: 'Missing required fields: address, signature, message' 
        });
      }

      // Import ethers for signature verification
      const { ethers } = await import('ethers');
      
      // Verify the signature
      const recoveredAddress = ethers.verifyMessage(message, signature);
      
      if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
        return res.status(401).json({ 
          error: 'Invalid signature - signature does not match address' 
        });
      }

      // Check BAM token balance using Web3
      const Web3 = (await import('web3')).default;
      const web3 = new Web3('https://bsc-dataseed1.binance.org/');
      
      const BAM_TOKEN_ADDRESS = '0x4BA74Df6b4a74cb1A7c9F60b4e5c5c19d58A2DA0';
      const tokenABI = [
        {
          "constant": true,
          "inputs": [{"name": "_owner", "type": "address"}],
          "name": "balanceOf",
          "outputs": [{"name": "balance", "type": "uint256"}],
          "type": "function"
        },
        {
          "constant": true,
          "inputs": [],
          "name": "decimals",
          "outputs": [{"name": "", "type": "uint8"}],
          "type": "function"
        }
      ];

      const tokenContract = new web3.eth.Contract(tokenABI as any, BAM_TOKEN_ADDRESS);
      const balance = await tokenContract.methods.balanceOf(address).call();
      const decimals = await tokenContract.methods.decimals().call();
      
      // Convert balance using proper decimals
      const balanceInTokens = Number(balance) / Math.pow(10, Number(decimals));
      const requiredBalance = 10000000; // 10M BAM tokens
      
      if (balanceInTokens < requiredBalance) {
        return res.status(403).json({ 
          error: 'Insufficient BAM token balance',
          required: requiredBalance,
          current: balanceInTokens,
          message: 'You need at least 10M BAM tokens to access BAM AIChat'
        });
      }

      res.status(200).json({
        success: true,
        address: address,
        bamBalance: balanceInTokens,
        verified: true,
        message: 'Wallet successfully verified for BAM AIChat access'
      });

    } catch (error: unknown) {
      console.error('Wallet verification error:', error);
      res.status(500).json({ 
        error: 'Wallet verification failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // AI chat route
  app.post('/api/ai',
    chatRateLimit,
    enhancedAuth,
    chatValidation,
    handleValidationErrors,
    async (req: any, res: any) => {
    try {
      const { message, conversationHistory = [] } = req.body;

      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      // Generate AI response using the AI service
      const aiResponse = await aiService.chat([
        ...conversationHistory.map((msg: any) => ({
          role: msg.role,
          content: msg.content
        })),
        { role: 'user', content: message }
      ], 'general');

      res.status(200).json({
        response: aiResponse.message,
        timestamp: new Date().toISOString()
      });

    } catch (error: unknown) {
      console.error('AI Chat Error:', error);
      res.status(500).json({ 
        error: 'Failed to generate response',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });



  // Enhanced health checks
  app.get('/api/health', async (req, res) => {
    const dbHealth = await dbHealthMonitor.checkHealth(db);
    const scalingStats = autoScaler.getStats();
    
    res.json({ 
      status: dbHealth ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      database: dbHealthMonitor.getStatus(),
      scaling: scalingStats,
      uptime: process.uptime()
    });
  });

  // Production readiness check
  app.get('/api/readiness', async (req, res) => {
    const readiness = await readinessChecker.runChecks();
    res.status(readiness.ready ? 200 : 503).json(readiness);
  });

  // System metrics endpoint
  app.get('/api/metrics', (req, res) => {
    res.json({
      deduplicator: requestDeduplicator.getStats(),
      scaling: autoScaler.getStats(),
      database: dbHealthMonitor.getStatus(),
      timestamp: new Date().toISOString(),
    });
  });

  const httpServer = createServer(app);
  
  // Setup graceful shutdown
  gracefulShutdown(httpServer);
  
  return httpServer;
}