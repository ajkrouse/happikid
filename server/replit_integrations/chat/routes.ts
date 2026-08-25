import type { Express, Request, Response } from "express";
import OpenAI from "openai";
import { isAuthenticated } from "../../replitAuth";
import { aiLimiter } from "../../middleware/rateLimiter";
import { chatStorage } from "./storage";
import { z } from "zod";
import { createLogger } from "../../logger";
import { AI_REQUEST_TIMEOUT_MS, withTimeout } from "../../services/aiResilience";

const log = createLogger("chat-routes");

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const createConversationSchema = z.object({
  title: z.string().max(200).optional(),
});

const sendMessageSchema = z.object({
  content: z.string().min(1).max(4000),
});

export function registerChatRoutes(app: Express): void {
  app.use("/api/conversations", isAuthenticated, aiLimiter);

  app.get("/api/conversations", async (req: any, res: Response) => {
    try {
      res.json(await chatStorage.getAllConversations(req.user.claims.sub));
    } catch (error) {
      log.error({ err: error }, "Error fetching conversations");
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  app.get("/api/conversations/:id", async (req: any, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid conversation ID" });
      const conversation = await chatStorage.getConversation(id, req.user.claims.sub);
      if (!conversation) return res.status(404).json({ error: "Conversation not found" });
      const messages = await chatStorage.getMessagesByConversation(id, req.user.claims.sub);
      res.json({ ...conversation, messages });
    } catch (error) {
      log.error({ err: error }, "Error fetching conversation");
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });

  app.post("/api/conversations", async (req: any, res: Response) => {
    try {
      const parsed = createConversationSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request", details: parsed.error.errors });
      }
      res.status(201).json(await chatStorage.createConversation(parsed.data.title || "New Chat", req.user.claims.sub));
    } catch (error) {
      log.error({ err: error }, "Error creating conversation");
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  app.delete("/api/conversations/:id", async (req: any, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid conversation ID" });
      const deleted = await chatStorage.deleteConversation(id, req.user.claims.sub);
      if (!deleted) return res.status(404).json({ error: "Conversation not found" });
      res.status(204).send();
    } catch (error) {
      log.error({ err: error }, "Error deleting conversation");
      res.status(500).json({ error: "Failed to delete conversation" });
    }
  });

  app.post("/api/conversations/:id/messages", async (req: any, res: Response) => {
    try {
      const conversationId = parseInt(req.params.id);
      if (isNaN(conversationId)) return res.status(400).json({ error: "Invalid conversation ID" });
      const parsed = sendMessageSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request", details: parsed.error.errors });
      }
      const { content } = parsed.data;
      const userId = req.user.claims.sub as string;
      const conversation = await chatStorage.getConversation(conversationId, userId);
      if (!conversation) return res.status(404).json({ error: "Conversation not found" });

      await chatStorage.createMessage(conversationId, "user", content);
      const messages = await chatStorage.getMessagesByConversation(conversationId, userId);
      const chatMessages = messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const controller = new AbortController();
      let iterator: AsyncIterator<any> | undefined;
      let completed = false;
      const cancelStream = () => {
        controller.abort();
        const returnResult = iterator?.return?.();
        if (returnResult) void Promise.resolve(returnResult).catch(() => {});
      };
      const cancelIfClientDisconnected = () => {
        if (!res.writableEnded) cancelStream();
      };
      req.once("aborted", cancelStream);
      res.once("close", cancelIfClientDisconnected);

      try {
        const stream = await withTimeout(
          openai.chat.completions.create({
            model: "gpt-5.1",
            messages: chatMessages,
            stream: true,
            max_completion_tokens: 2048,
          }, { signal: controller.signal }),
          AI_REQUEST_TIMEOUT_MS,
          cancelStream,
        );

        let fullResponse = "";
        iterator = stream[Symbol.asyncIterator]();
        while (true) {
          const { value: chunk, done } = await withTimeout(
            iterator.next(),
            AI_REQUEST_TIMEOUT_MS,
            cancelStream,
          );
          if (done) break;
          const delta = chunk.choices[0]?.delta?.content || "";
          if (delta) {
            fullResponse += delta;
            res.write(`data: ${JSON.stringify({ content: delta })}\n\n`);
          }
        }

        await chatStorage.createMessage(conversationId, "assistant", fullResponse);
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
        completed = true;
      } finally {
        req.off("aborted", cancelStream);
        res.off("close", cancelIfClientDisconnected);
        if (!completed) cancelStream();
      }
    } catch (error) {
      log.error({ err: error }, "Error sending message");
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({
          error: "AI is temporarily unavailable. Your message was saved; please try again.",
        })}\n\n`);
        res.end();
      } else {
        res.status(503).json({
          ok: false,
          message: "AI is temporarily unavailable. Your message was saved; please try again.",
        });
      }
    }
  });
}
