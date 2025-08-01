import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { aiService } from "./ai";
import { cryptoService } from "./cryptoService";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
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

  // Chat routes
  app.post('/api/chat/conversations', isAuthenticated, async (req: any, res) => {
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

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  const httpServer = createServer(app);
  return httpServer;
}