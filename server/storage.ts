import {
  users,
  conversations,
  messages,
  cryptoUpdates,
  learningTopics,
  userActivity,
  type User,
  type UpsertUser,
  type Conversation,
  type InsertConversation,
  type Message,
  type InsertMessage,
  type CryptoUpdate,
  type InsertCryptoUpdate,
  type LearningTopic,
  type InsertLearningTopic,
  type UserActivity,
  type InsertUserActivity,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, count } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByWallet(walletAddress: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserActivity(userId: string): Promise<void>;
  createUsername(walletAddress: string, username: string, displayName?: string): Promise<User>;
  updateUserProfile(walletAddress: string, updates: { username?: string; displayName?: string; lastUsernameChange?: Date }): Promise<User>;
  
  // Conversation operations
  getConversations(userId: string): Promise<Conversation[]>;
  getConversation(id: string): Promise<Conversation | undefined>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation>;
  deleteConversation(id: string): Promise<void>;
  getConversationCount(userId: string): Promise<number>;
  
  // Message operations
  getMessages(conversationId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  
  // Crypto updates operations
  getCryptoUpdates(category?: string, limit?: number): Promise<CryptoUpdate[]>;
  createCryptoUpdate(update: InsertCryptoUpdate): Promise<CryptoUpdate>;
  getHighlightedUpdates(): Promise<CryptoUpdate[]>;
  
  // Learning topics operations
  getLearningTopics(category?: string, difficulty?: string): Promise<LearningTopic[]>;
  getLearningTopic(id: string): Promise<LearningTopic | undefined>;
  createLearningTopic(topic: InsertLearningTopic): Promise<LearningTopic>;
  incrementTopicViews(id: string): Promise<void>;
  
  // Analytics operations
  logUserActivity(activity: InsertUserActivity): Promise<UserActivity>;
  getUserStats(userId: string): Promise<{
    totalChats: number;
    totalMessages: number;
    lastActive: Date | null;
    recentChats: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByWallet(walletAddress: string): Promise<User | undefined> {
    // Normalize wallet address to lowercase for consistent lookups
    const normalizedWallet = walletAddress.toLowerCase();
    const [user] = await db.select().from(users).where(eq(users.walletAddress, normalizedWallet));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUsername(walletAddress: string, username: string, displayName?: string, email?: string, country?: string): Promise<User> {
    // Normalize wallet address for consistency
    const normalizedWallet = walletAddress.toLowerCase();
    
    let existingUser = await this.getUserByWallet(normalizedWallet);
    if (!existingUser) {
      // Create user if they don't exist
      console.log(`Creating new user for wallet: ${normalizedWallet}`);
      existingUser = await this.upsertUser({
        id: normalizedWallet,
        walletAddress: normalizedWallet,
        email: email || `${normalizedWallet}@temp.local`,
        firstName: null,
        lastName: null,
        username: null,
        displayName: null,
        country: country || 'US',
        profileImageUrl: null
      });
    }

    const [updatedUser] = await db
      .update(users)
      .set({
        username,
        displayName: displayName || username,
        ...(email && { email }),
        ...(country && { country }),
        lastUsernameChange: new Date(), // Track when username was first created
        updatedAt: new Date(),
      })
      .where(eq(users.walletAddress, normalizedWallet))
      .returning();

    return updatedUser;
  }

  async updateUserProfile(walletAddress: string, updates: { username?: string; displayName?: string; email?: string; country?: string; lastUsernameChange?: Date }): Promise<User> {
    const normalizedWallet = walletAddress.toLowerCase();
    
    const [user] = await db
      .update(users)
      .set({ 
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(users.walletAddress, normalizedWallet))
      .returning();
    
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserActivity(userId: string): Promise<void> {
    await db
      .update(users)
      .set({ lastActive: new Date() })
      .where(eq(users.id, userId));
  }

  // Conversation operations with rate limiting to 10 recent chats
  async getConversations(userId: string): Promise<Conversation[]> {
    return await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.userId, userId), eq(conversations.isActive, true)))
      .orderBy(desc(conversations.lastMessageAt))
      .limit(10); // Rate limit to 10 most recent conversations per user
  }

  async getConversation(id: string): Promise<Conversation | undefined> {
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id));
    return conversation;
  }

  async createConversation(conversationData: InsertConversation): Promise<Conversation> {
    // First, enforce the 10 conversation limit per user
    if (conversationData.userId) {
      await this.enforceConversationLimit(conversationData.userId);
    }
    
    const [conversation] = await db
      .insert(conversations)
      .values(conversationData)
      .returning();
    return conversation;
  }

  // Enforce 10 conversation limit per user by soft-deleting oldest conversations
  private async enforceConversationLimit(userId: string): Promise<void> {
    const userConversations = await db
      .select({ id: conversations.id })
      .from(conversations)
      .where(and(eq(conversations.userId, userId), eq(conversations.isActive, true)))
      .orderBy(desc(conversations.lastMessageAt));

    if (userConversations.length >= 10) {
      // Get conversations to deactivate (keep only 9 most recent, so new one makes 10)
      const conversationsToDeactivate = userConversations.slice(9);
      
      for (const conv of conversationsToDeactivate) {
        await db
          .update(conversations)
          .set({ isActive: false, updatedAt: new Date() })
          .where(eq(conversations.id, conv.id));
      }
      
      console.log(`Rate limited user ${userId}: deactivated ${conversationsToDeactivate.length} old conversations`);
    }
  }

  async updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation> {
    const [conversation] = await db
      .update(conversations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(conversations.id, id))
      .returning();
    return conversation;
  }

  async deleteConversation(id: string): Promise<void> {
    await db
      .update(conversations)
      .set({ isActive: false })
      .where(eq(conversations.id, id));
  }

  // Message operations
  async getMessages(conversationId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);
  }

  async createMessage(messageData: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(messageData)
      .returning();

    // Update conversation message count and last message time
    if (messageData.conversationId) {
      await db
        .update(conversations)
        .set({
          messageCount: sql`${conversations.messageCount} + 1`,
          lastMessageAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(conversations.id, messageData.conversationId));
    }

    return message;
  }

  // Crypto updates operations
  async getCryptoUpdates(category?: string, limit = 50): Promise<CryptoUpdate[]> {
    const baseQuery = db.select().from(cryptoUpdates);
    
    if (category) {
      return await baseQuery
        .where(eq(cryptoUpdates.category, category))
        .orderBy(desc(cryptoUpdates.publishedAt))
        .limit(limit);
    }
    
    return await baseQuery
      .orderBy(desc(cryptoUpdates.publishedAt))
      .limit(limit);
  }

  async createCryptoUpdate(updateData: InsertCryptoUpdate): Promise<CryptoUpdate> {
    const [update] = await db
      .insert(cryptoUpdates)
      .values(updateData)
      .returning();
    return update;
  }

  async getHighlightedUpdates(): Promise<CryptoUpdate[]> {
    return await db
      .select()
      .from(cryptoUpdates)
      .where(eq(cryptoUpdates.isHighlighted, true))
      .orderBy(desc(cryptoUpdates.publishedAt))
      .limit(10);
  }

  // Learning topics operations
  async getLearningTopics(category?: string, difficulty?: string): Promise<LearningTopic[]> {
    let conditions = [eq(learningTopics.isPublished, true)];
    
    if (category) {
      conditions.push(eq(learningTopics.category, category));
    }
    
    if (difficulty) {
      conditions.push(eq(learningTopics.difficulty, difficulty));
    }
    
    return await db
      .select()
      .from(learningTopics)
      .where(and(...conditions))
      .orderBy(learningTopics.title);
  }

  async getLearningTopic(id: string): Promise<LearningTopic | undefined> {
    const [topic] = await db
      .select()
      .from(learningTopics)
      .where(and(eq(learningTopics.id, id), eq(learningTopics.isPublished, true)));
    return topic;
  }

  async createLearningTopic(topicData: InsertLearningTopic): Promise<LearningTopic> {
    const [topic] = await db
      .insert(learningTopics)
      .values(topicData)
      .returning();
    return topic;
  }

  async incrementTopicViews(id: string): Promise<void> {
    await db
      .update(learningTopics)
      .set({ viewCount: sql`${learningTopics.viewCount} + 1` })
      .where(eq(learningTopics.id, id));
  }

  // Analytics operations
  async logUserActivity(activityData: InsertUserActivity): Promise<UserActivity> {
    const [activity] = await db
      .insert(userActivity)
      .values(activityData)
      .returning();
    return activity;
  }

  // Get conversation count for debugging
  async getConversationCount(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(conversations)
      .where(and(eq(conversations.userId, userId), eq(conversations.isActive, true)));
    
    return result.count;
  }

  async getUserStats(userId: string): Promise<{
    totalChats: number;
    totalMessages: number;
    lastActive: Date | null;
    recentChats: number;
  }> {
    const [chatCount] = await db
      .select({ count: count() })
      .from(conversations)
      .where(and(eq(conversations.userId, userId), eq(conversations.isActive, true)));

    const [messageCount] = await db
      .select({ count: count() })
      .from(messages)
      .innerJoin(conversations, eq(messages.conversationId, conversations.id))
      .where(and(eq(conversations.userId, userId), eq(messages.role, 'user')));

    const [user] = await db
      .select({ lastActive: users.lastActive })
      .from(users)
      .where(eq(users.id, userId));

    return {
      totalChats: chatCount.count,
      totalMessages: messageCount.count,
      lastActive: user?.lastActive || null,
      recentChats: chatCount.count, // Same as totalChats since we only show recent (max 10)
    };
  }
}

export const storage = new DatabaseStorage();