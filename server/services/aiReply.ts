import OpenAI from "openai";
import type { Provider, ThreadMessage } from "@shared/schema";
import { createLogger } from "../logger";
import { formatMinimizedProviderContext, scrubTextForAI } from "./aiPrivacy";
import {
  AI_REPLY_CACHE_TTL_MS,
  createAICacheKey,
  runBoundedCachedAI,
} from "./aiResilience";

const log = createLogger("ai-reply");

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

/**
 * Build a compact, factual profile context for the provider so the AI
 * answers from real data instead of inventing details.
 */
export function buildProviderContext(provider: Provider): string {
  return formatMinimizedProviderContext(provider);
}

/**
 * Generate a draft reply to the latest parent message in a thread.
 * Returns the draft text, or null when generation fails.
 * Never auto-sends — the provider reviews, edits, and sends the draft.
 */
export async function generateReplyDraft(
  provider: Provider,
  messages: ThreadMessage[],
  providerOwnerUserId: string
): Promise<string | null> {
  const latestParentMessage = [...messages]
    .reverse()
    .find((message) => message.senderUserId !== providerOwnerUserId);
  const scrubbedMessage = latestParentMessage ? scrubTextForAI(latestParentMessage.body) : null;
  if (!scrubbedMessage || scrubbedMessage.hadSensitiveContent || !scrubbedMessage.text) return null;
  const redactedMessage = scrubbedMessage.text;
  const providerContext = buildProviderContext(provider);

  const systemPrompt = `You are drafting a reply on behalf of a childcare provider to a parent's message on HappiKid, a childcare marketplace.

Rules:
- Answer ONLY from the provider profile facts given below. If the profile does not contain the answer, say you'll get back to them with that detail — never invent facts, prices, ratios, or policies.
- Write in first person as the provider ("we", "our program").
- Be warm, professional, and concise (under 120 words).
- Do not include a subject line, signature block, or placeholders like [Name].
- Reply in the same language as the redacted message.
- Never request or mention personal contact, health, family, or financial details.

Provider profile facts:
${providerContext}`;

  try {
    return await runBoundedCachedAI(
      createAICacheKey("reply-draft", {
        providerOwnerUserId,
        providerContext,
        redactedMessage,
      }),
      async (signal) => {
        const response = await openai.chat.completions.create(
          {
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: systemPrompt },
              {
                role: "user",
                content: `The parent's redacted latest message:\n${redactedMessage}\n\nDraft the provider's reply.`,
              },
            ],
            max_tokens: 300,
            temperature: 0.6,
          },
          { signal },
        );

        const draft = response.choices[0]?.message?.content?.trim();
        return draft && draft.length > 0 ? draft : null;
      },
      { ttlMs: AI_REPLY_CACHE_TTL_MS },
    );
  } catch (error) {
    log.error({ err: error }, "Failed to generate AI reply draft");
    return null;
  }
}
