import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  boolean,
  integer,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  walletAddress: varchar("wallet_address").unique(),
  username: varchar("username").unique(),
  displayName: varchar("display_name"),
  isVerified: boolean("is_verified").default(false),
  bamTokenBalance: varchar("bam_token_balance").default("0"),
  lastActive: timestamp("last_active").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chat conversations table
export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  title: varchar("title").notNull(),
  category: varchar("category").notNull(), // 'crypto', 'research', 'learn', 'general'
  isActive: boolean("is_active").default(true),
  messageCount: integer("message_count").default(0),
  lastMessageAt: timestamp("last_message_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Messages table
export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: uuid("conversation_id").references(() => conversations.id),
  role: varchar("role").notNull(), // 'user', 'assistant'
  content: text("content").notNull(),
  metadata: jsonb("metadata"), // For citations, sources, crypto data
  tokens: integer("tokens"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Crypto updates/news table
export const cryptoUpdates = pgTable("crypto_updates", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  summary: text("summary").notNull(),
  category: varchar("category").notNull(), // 'news', 'airdrop', 'web3', 'market'
  source: varchar("source").notNull(),
  url: varchar("url"),
  sentiment: varchar("sentiment"), // 'positive', 'negative', 'neutral'
  relevanceScore: integer("relevance_score"), // 1-100
  isHighlighted: boolean("is_highlighted").default(false),
  publishedAt: timestamp("published_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Learning topics/guides table
export const learningTopics = pgTable("learning_topics", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  content: text("content").notNull(),
  category: varchar("category").notNull(), // 'crypto', 'web3', 'blockchain', 'defi'
  difficulty: varchar("difficulty").notNull(), // 'beginner', 'intermediate', 'advanced'
  estimatedTime: integer("estimated_time"), // in minutes
  tags: jsonb("tags"),
  isPublished: boolean("is_published").default(true),
  viewCount: integer("view_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User activity/analytics table
export const userActivity = pgTable("user_activity", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  action: varchar("action").notNull(), // 'chat', 'research', 'learn', 'update_view'
  metadata: jsonb("metadata"),
  ipAddress: varchar("ip_address"),
  userAgent: varchar("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  conversations: many(conversations),
  activities: many(userActivity),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  user: one(users, {
    fields: [conversations.userId],
    references: [users.id],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}));

export const userActivityRelations = relations(userActivity, ({ one }) => ({
  user: one(users, {
    fields: [userActivity.userId],
    references: [users.id],
  }),
}));

// Types
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;
export type CryptoUpdate = typeof cryptoUpdates.$inferSelect;
export type InsertCryptoUpdate = typeof cryptoUpdates.$inferInsert;
export type LearningTopic = typeof learningTopics.$inferSelect;
export type InsertLearningTopic = typeof learningTopics.$inferInsert;
export type UserActivity = typeof userActivity.$inferSelect;
export type InsertUserActivity = typeof userActivity.$inferInsert;



// Zod schemas
export const insertUserSchema = createInsertSchema(users);
export const insertConversationSchema = createInsertSchema(conversations);
export const insertMessageSchema = createInsertSchema(messages);
export const insertCryptoUpdateSchema = createInsertSchema(cryptoUpdates);
export const insertLearningTopicSchema = createInsertSchema(learningTopics);
export const insertUserActivitySchema = createInsertSchema(userActivity);