import type { Provider } from "@shared/schema";
import { getPublicPricing } from "../lib/providerAccess";

const MAX_AI_TEXT_LENGTH = 600;
const SENSITIVE_DETAIL_PATTERN = /\b(?:autism|autistic|diagnos(?:is|ed)|medical|medication|allerg(?:y|ies|ic)|disabilit(?:y|ies)|therapy|iep|health condition|income|salary|financial|budget|assistance|subsid(?:y|ies)|welfare|voucher)\b/i;
const SAFE_LOCATION_NAMES = new Set(["new york", "new jersey", "jersey city", "hoboken", "brooklyn", "queens", "bronx", "manhattan", "staten island"]);

function likelyContainsPersonalName(text: string): boolean {
  if (/\b(?:my name is|i am|i'm|this is|call me)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/.test(text)) {
    return true;
  }
  if (/\b[A-Z][a-z]{1,30}\s+(?:has|needs|is|will|would|can|lives|attends|starts)\b/.test(text)) {
    return true;
  }
  const pairs = text.match(/\b[A-Z][a-z]{1,30}\s+[A-Z][a-z]{1,30}\b/g) ?? [];
  return pairs.some((pair) => !SAFE_LOCATION_NAMES.has(pair.toLowerCase()));
}

export interface ScrubbedAIText {
  text: string;
  hadSensitiveContent: boolean;
}

/**
 * Removes formatted identifiers and flags any input containing a sensitive
 * category or likely personal name. Callers must withhold flagged input from
 * external models rather than relying on partial redaction.
 */
export function scrubTextForAI(input: string, maxLength = MAX_AI_TEXT_LENGTH): ScrubbedAIText {
  const normalized = input
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const sentences = normalized.split(/(?<=[.!?])\s+/).filter(Boolean);
  let hadSensitiveContent = false;
  let text = sentences.map((sentence) => {
    if (SENSITIVE_DETAIL_PATTERN.test(sentence)) {
      hadSensitiveContent = true;
      return "[sensitive details removed]";
    }
    if (likelyContainsPersonalName(sentence)) {
      hadSensitiveContent = true;
      return "[name removed]";
    }
    return sentence;
  }).join(" ");

  const substitutions: Array<[RegExp, string]> = [
    [/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[email removed]"],
    [/\b(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}\b/g, "[phone removed]"],
    [/\bhttps?:\/\/\S+\b/gi, "[link removed]"],
    [/\b\d{3}-?\d{2}-?\d{4}\b/g, "[identifier removed]"],
    [/\b(?:address|apt\.?|apartment|unit)\s*[:#-]?\s*[^.!?;]{0,100}/gi, "[address removed]"],
    [/\b\d{1,5}\s+[A-Za-z][A-Za-z.'-]*(?:\s+[A-Za-z][A-Za-z.'-]*){0,4}\s+(?:street|st\.?|avenue|ave\.?|road|rd\.?|boulevard|blvd\.?|lane|ln\.?|drive|dr\.?|place|pl\.?)\b/gi, "[address removed]"],
    [/\b(?:my|our)\s+(?:child|kid|baby|son|daughter|family|spouse|partner)\b[^.!?;]{0,180}/gi, "[family details removed]"],
  ];

  for (const [pattern, replacement] of substitutions) {
    text = text.replace(pattern, () => {
      hadSensitiveContent = true;
      return replacement;
    });
  }

  return { text: text.slice(0, maxLength).trim(), hadSensitiveContent };
}

export function redactTextForAI(input: string, maxLength = MAX_AI_TEXT_LENGTH): string {
  return scrubTextForAI(input, maxLength).text;
}

export function isSafeAIText(text: string): boolean {
  return text.length > 0 && !/^\[(?:sensitive details|name|family details) removed\]$/i.test(text);
}

/**
 * Produces the minimum structured, publicly visible program facts useful for
 * search summaries, comparisons, and reply drafts. It intentionally excludes
 * all free text, addresses, contacts, custom fields, and account data.
 */
export function formatMinimizedProviderContext(provider: Provider): string {
  const parts = [`Program type: ${provider.type || "childcare"}`];

  const city = (provider.city || "").replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, 50);
  const state = (provider.state || "").replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, 20);
  if (city && state) parts.push(`Service area: ${city}, ${state}`);

  if (provider.ageRangeMin != null && provider.ageRangeMax != null) {
    const minYears = Math.floor(provider.ageRangeMin / 12);
    const maxYears = Math.floor(provider.ageRangeMax / 12);
    parts.push(`Ages served: ${minYears}-${maxYears} years`);
  }

  const pricing = getPublicPricing(provider);
  if (provider.showExactPrice === false) {
    parts.push("Pricing: exact tuition is not publicly shared. Do not state any dollar amount.");
  } else if (pricing.monthlyPriceMin && pricing.monthlyPriceMax) {
    parts.push(`Monthly price range: $${pricing.monthlyPriceMin}–$${pricing.monthlyPriceMax}`);
  } else if (pricing.monthlyPrice) {
    parts.push(`Monthly price: $${pricing.monthlyPrice}/month`);
  }

  if (provider.hoursOpen && provider.hoursClose) {
    parts.push(`Hours: ${provider.hoursOpen}-${provider.hoursClose}`);
  }
  if (provider.enrollmentStatus) parts.push(`Enrollment: ${provider.enrollmentStatus}`);
  if (provider.isVerifiedByGov) parts.push("Government verified: yes");
  if (provider.rating && Number(provider.rating) > 0) parts.push(`Public rating: ${provider.rating}/5`);

  return parts.join(" | ");
}

export function buildRedactedRecentChatMessages(
  messages: Array<{ role: string; content: string }>,
  limit = 4,
) {
  return scrubRecentChatMessages(messages, limit).messages;
}

export function scrubRecentChatMessages(
  messages: Array<{ role: string; content: string }>,
  limit = 4,
) {
  const scrubbed = messages.slice(-limit).map((message) => ({
    role: message.role === "assistant" ? "assistant" as const : "user" as const,
    scrubbedContent: scrubTextForAI(message.content),
  }));

  return {
    hadSensitiveContent: scrubbed.some(({ scrubbedContent }) => scrubbedContent.hadSensitiveContent),
    messages: scrubbed.map(({ role, scrubbedContent }) => ({
      role,
      content: scrubbedContent.text,
    })),
  };
}