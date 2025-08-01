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
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserActivity(userId: string): Promise<void>;
  
  // Conversation operations
  getConversations(userId: string): Promise<Conversation[]>;
  getConversation(id: string): Promise<Conversation | undefined>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation>;
  deleteConversation(id: string): Promise<void>;
  
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
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByWallet(walletAddress: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.walletAddress, walletAddress));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.walletAddress,
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

  // Conversation operations
  async getConversations(userId: string): Promise<Conversation[]> {
    return await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.userId, userId), eq(conversations.isActive, true)))
      .orderBy(desc(conversations.lastMessageAt));
  }

  async getConversation(id: string): Promise<Conversation | undefined> {
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id));
    return conversation;
  }

  async createConversation(conversationData: InsertConversation): Promise<Conversation> {
    const [conversation] = await db
      .insert(conversations)
      .values(conversationData)
      .returning();
    return conversation;
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

  async getUserStats(userId: string): Promise<{
    totalChats: number;
    totalMessages: number;
    lastActive: Date | null;
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
    };
  }
}

export const storage = new DatabaseStorage();