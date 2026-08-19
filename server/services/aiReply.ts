import OpenAI from "openai";
import type { Provider, ThreadMessage } from "@shared/schema";
import { createLogger } from "../logger";

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
  const lines: string[] = [`Business name: ${provider.name}`, `Type: ${provider.type}`];

  if (provider.description) lines.push(`Description: ${provider.description}`);
  lines.push(`Location: ${provider.address}, ${provider.city}, ${provider.state} ${provider.zipCode}`);

  const minMonths = provider.minAgeMonths ?? provider.ageMinMonths;
  const maxMonths = provider.maxAgeMonths ?? provider.ageMaxMonths;
  if (minMonths != null && maxMonths != null) {
    lines.push(`Ages served: ${minMonths}–${maxMonths} months`);
  } else if (provider.ageRangeMin != null && provider.ageRangeMax != null) {
    lines.push(`Ages served: ${provider.ageRangeMin}–${provider.ageRangeMax} (months)`);
  }

  const capacity = provider.totalCapacity ?? provider.capacity;
  if (capacity != null) lines.push(`Capacity: ${capacity} children`);

  if (provider.hoursOpen && provider.hoursClose) {
    lines.push(`Hours: ${provider.hoursOpen}–${provider.hoursClose}`);
  }
  if (provider.schedule) lines.push(`Schedule: ${JSON.stringify(provider.schedule)}`);

  // Pricing — respect the provider's exact-price visibility preference.
  // When exact pricing is hidden, NO numeric price (fixed or range) may enter the
  // model context; the profile publicly shows only a non-numeric cost level.
  if (provider.showExactPrice === false) {
    lines.push(
      "Pricing: exact tuition amounts are not shared publicly. Do not state any dollar amount; invite the parent to ask us directly for current tuition details."
    );
  } else if (provider.monthlyPrice) {
    lines.push(`Monthly price: $${provider.monthlyPrice}`);
  } else if (provider.monthlyPriceMin && provider.monthlyPriceMax) {
    lines.push(`Monthly price range: $${provider.monthlyPriceMin}–$${provider.monthlyPriceMax}`);
  }
  if (provider.acceptsSubsidies) lines.push(`Accepts subsidies / financial assistance: yes`);

  if (provider.features && provider.features.length > 0) {
    lines.push(`Features: ${provider.features.join(", ")}`);
  }
  if (Array.isArray(provider.featuresCustom) && (provider.featuresCustom as any[]).length > 0) {
    lines.push(`Additional features: ${(provider.featuresCustom as any[]).join(", ")}`);
  }
  if (provider.programHighlights && provider.programHighlights.length > 0) {
    lines.push(`Program highlights: ${provider.programHighlights.join("; ")}`);
  }
  if (provider.uniqueSellingPoints && provider.uniqueSellingPoints.length > 0) {
    lines.push(`Unique selling points: ${provider.uniqueSellingPoints.join("; ")}`);
  }
  if (provider.accreditationDetails) lines.push(`Accreditation: ${provider.accreditationDetails}`);
  lines.push(`Enrollment status: ${provider.enrollmentStatus ?? "accepting"}`);
  if (provider.closureNote) lines.push(`Closure note: ${provider.closureNote}`);

  if (Array.isArray(provider.faqs) && (provider.faqs as any[]).length > 0) {
    const faqLines = (provider.faqs as any[])
      .filter((f: any) => f?.question && f?.answer)
      .map((f: any) => `Q: ${f.question}\nA: ${f.answer}`);
    if (faqLines.length > 0) lines.push(`FAQs:\n${faqLines.join("\n")}`);
  }

  return lines.join("\n");
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
  // Last ~10 messages give enough conversational context without bloating the prompt
  const recent = messages.slice(-10);
  const transcript = recent
    .map((m) => `${m.senderUserId === providerOwnerUserId ? "Provider" : "Parent"}: ${m.body}`)
    .join("\n");

  const systemPrompt = `You are drafting a reply on behalf of a childcare provider to a parent's message on HappiKid, a childcare marketplace.

Rules:
- Answer ONLY from the provider profile facts given below. If the profile does not contain the answer, say you'll get back to them with that detail — never invent facts, prices, ratios, or policies.
- Write in first person as the provider ("we", "our program").
- Be warm, professional, and concise (under 120 words).
- Do not include a subject line, signature block, or placeholders like [Name].
- Reply in the same language the parent wrote in.

Provider profile facts:
${buildProviderContext(provider)}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Conversation so far:\n${transcript}\n\nDraft the provider's reply to the parent's most recent message.`,
        },
      ],
      max_tokens: 300,
      temperature: 0.6,
    });

    const draft = response.choices[0]?.message?.content?.trim();
    return draft && draft.length > 0 ? draft : null;
  } catch (error) {
    log.error({ err: error }, "Failed to generate AI reply draft");
    return null;
  }
}
