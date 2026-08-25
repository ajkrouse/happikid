import { db } from "../../db";
import { conversations, messages } from "../../../shared/schema";
import { and, eq, desc } from "drizzle-orm";

export interface IChatStorage {
  getConversation(id: number, userId: string): Promise<typeof conversations.$inferSelect | undefined>;
  getAllConversations(userId: string): Promise<(typeof conversations.$inferSelect)[]>;
  createConversation(title: string, userId: string): Promise<typeof conversations.$inferSelect>;
  deleteConversation(id: number, userId: string): Promise<boolean>;
  getMessagesByConversation(conversationId: number, userId: string): Promise<(typeof messages.$inferSelect)[]>;
  createMessage(conversationId: number, role: string, content: string): Promise<typeof messages.$inferSelect>;
}

export const chatStorage: IChatStorage = {
  async getConversation(id: number, userId: string) {
    const [conversation] = await db.select().from(conversations).where(
      and(eq(conversations.id, id), eq(conversations.userId, userId)),
    );
    return conversation;
  },

  async getAllConversations(userId: string) {
    return db.select().from(conversations)
      .where(eq(conversations.userId, userId))
      .orderBy(desc(conversations.createdAt));
  },

  async createConversation(title: string, userId: string) {
    const [conversation] = await db.insert(conversations).values({ title, userId }).returning();
    return conversation;
  },

  async deleteConversation(id: number, userId: string) {
    const deleted = await db.delete(conversations).where(
      and(eq(conversations.id, id), eq(conversations.userId, userId)),
    ).returning({ id: conversations.id });
    return deleted.length > 0;
  },

  async getMessagesByConversation(conversationId: number, userId: string) {
    return db.select({ message: messages })
      .from(messages)
      .innerJoin(conversations, eq(messages.conversationId, conversations.id))
      .where(and(
        eq(messages.conversationId, conversationId),
        eq(conversations.userId, userId),
      ))
      .orderBy(messages.createdAt)
      .then((rows) => rows.map(({ message }) => message));
  },

  async createMessage(conversationId: number, role: string, content: string) {
    const [message] = await db.insert(messages).values({ conversationId, role, content }).returning();
    return message;
  },
};

