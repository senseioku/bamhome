import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { aiService } from "./ai";
import { cryptoService } from "./cryptoService";
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
  walletValidation
} from "./security";

export async function registerRoutes(app: Express): Promise<Server> {
  // Apply enterprise security middleware
  app.use(securityHeaders);
  app.use(corsOptions);
  app.use(securityLogger);
  app.use(abuseDetection);
  app.use(progressiveSlowDown);
  app.use(generalRateLimit);
  app.use(sanitizeInput);

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

  // Username management routes
  app.post('/api/user/username', 
    usernameRateLimit,
    enhancedAuth,
    isAuthenticated, 
    usernameValidation,
    handleValidationErrors,
    async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { username, displayName } = req.body;

      if (!username || username.length < 3 || username.length > 20) {
        return res.status(400).json({ message: "Username must be 3-20 characters" });
      }

      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser && existingUser.id !== userId) {
        return res.status(409).json({ message: "Username already taken" });
      }

      // Get user by wallet address from session
      const user = await storage.getUser(userId);
      if (!user?.walletAddress) {
        return res.status(400).json({ message: "Wallet address not found" });
      }

      const updatedUser = await storage.createUsername(user.walletAddress, username, displayName);
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

  // Chat routes
  app.post('/api/chat/conversations', 
    chatRateLimit,
    enhancedAuth,
    isAuthenticated,
    chatValidation,
    handleValidationErrors,
    async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { title, category = 'general' } = req.body;

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

  app.get('/api/chat/conversations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversations = await storage.getConversations(userId);
      res.json(conversations);
    } catch (error) {
      console.error('Get conversations error:', error);
      res.status(500).json({ message: 'Failed to get conversations' });
    }
  });

  app.get('/api/chat/conversations/:id', isAuthenticated, async (req: any, res) => {
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

  app.post('/api/chat/conversations/:id/messages', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { content } = req.body;
      const userId = req.user.claims.sub;

      if (!content?.trim()) {
        return res.status(400).json({ message: 'Message content is required' });
      }

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

  app.delete('/api/chat/conversations/:id', isAuthenticated, async (req: any, res) => {
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

  // Wallet verification route for BAM AIChat
  app.post('/api/wallet/verify',
    authRateLimit,
    enhancedAuth,
    walletValidation,
    handleValidationErrors,
    async (req, res) => {
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

    } catch (error) {
      console.error('Wallet verification error:', error);
      res.status(500).json({ 
        error: 'Wallet verification failed',
        details: error.message 
      });
    }
  });

  // AI chat route
  app.post('/api/ai',
    chatRateLimit,
    enhancedAuth,
    chatValidation,
    handleValidationErrors,
    async (req, res) => {
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

    } catch (error) {
      console.error('AI Chat Error:', error);
      res.status(500).json({ 
        error: 'Failed to generate response',
        details: error.message 
      });
    }
  });



  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  const httpServer = createServer(app);
  return httpServer;
}