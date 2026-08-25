import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createCompletion: vi.fn(),
}));

vi.mock("../server/logger", () => ({
  createLogger: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}));

vi.mock("openai", () => ({
  default: class OpenAI {
    chat = { completions: { create: mocks.createCompletion } };
  },
}));

import { clearAICache } from "../server/services/aiResilience";
import { redactTextForAI, buildRedactedRecentChatMessages } from "../server/services/aiPrivacy";
import { generateProviderComparison, generateSearchSummary } from "../server/services/aiSummaries";
import { generateReplyDraft } from "../server/services/aiReply";

const provider: any = {
  id: 1,
  name: "Ava's Private Family Daycare",
  type: "daycare",
  address: "123 Secret Street",
  city: "Brooklyn",
  state: "NY",
  zipCode: "11201",
  ageRangeMin: 12,
  ageRangeMax: 60,
  description: "Call Jane on 555-222-3333 for confidential arrangements.",
  faqs: [{ question: "Where do staff members live?", answer: "At 123 Secret Street." }],
  featuresCustom: ["Private pickup for the Gomez family"],
  closureNote: "Closed while the director receives medical treatment",
  monthlyPrice: "1800",
  showExactPrice: true,
  enrollmentStatus: "accepting",
};

function requestedPrompt() {
  return JSON.stringify(mocks.createCompletion.mock.calls[0]?.[0]?.messages ?? []);
}

describe("AI prompt minimization", () => {
  beforeEach(() => {
    clearAICache();
    vi.clearAllMocks();
    mocks.createCompletion.mockResolvedValue({
      choices: [{ message: { content: "Summary: Several programs match.\nHighlights:\n- Open enrollment" } }],
    });
  });

  it("never sends raw family search text or private provider free text to search summaries", async () => {
    await generateSearchSummary(
      "My daughter Ava has autism; email me at parent@example.com about daycare",
      [provider],
    );

    const prompt = requestedPrompt();
    expect(prompt).not.toContain("My daughter");
    expect(prompt).not.toContain("Ava");
    expect(prompt).not.toContain("parent@example.com");
    expect(prompt).not.toContain("Private Family Daycare");
    expect(prompt).not.toContain("123 Secret Street");
    expect(prompt).not.toContain("confidential arrangements");
    expect(prompt).not.toContain("Gomez family");
    expect(prompt).toContain("Type: daycare");
    expect(prompt).toContain("Brooklyn, NY");
  });

  it("sends only a safe latest parent message and limited public provider facts for reply drafts", async () => {
    await generateReplyDraft(
      provider,
      [
        { senderUserId: "parent", body: "Older history: my phone is 555-222-3333." },
        { senderUserId: "provider", body: "We can help." },
        { senderUserId: "parent", body: "Could you share your daily pickup time?" },
      ] as any,
      "provider-owner",
    );

    const prompt = requestedPrompt();
    expect(prompt).not.toContain("Older history");
    expect(prompt).not.toContain("phone is");
    expect(prompt).toContain("Could you share your daily pickup time?");
    expect(prompt).not.toContain("Private Family Daycare");
    expect(prompt).not.toContain("confidential arrangements");
  });

  it("withholds a mixed parent message rather than sending its safe portion", async () => {
    const draft = await generateReplyDraft(
      provider,
      [{ senderUserId: "parent", body: "Do you provide lunch? My name is Jane Doe." }] as any,
      "provider-owner",
    );

    expect(draft).toBeNull();
    expect(mocks.createCompletion).not.toHaveBeenCalled();
  });

  it("returns graceful fallbacks when the model is unavailable", async () => {
    mocks.createCompletion.mockRejectedValue(new Error("upstream unavailable"));

    await expect(generateSearchSummary("daycare", [provider])).resolves.toBeNull();
    await expect(generateProviderComparison([provider, { ...provider, id: 2 }])).resolves.toBeNull();
    await expect(generateReplyDraft(
      provider,
      [{ senderUserId: "parent", body: "Could you share your daily pickup time?" }] as any,
      "provider-owner",
    )).resolves.toBeNull();
  });

  it("redacts sensitive values from generic chat and image text before model processing", () => {
    const redacted = redactTextForAI(
      "My son has an allergy. Reach me at parent@example.com or 555-222-3333, 123 Secret Street.",
    );
    const chat = buildRedactedRecentChatMessages([
      { role: "user", content: "old private history" },
      { role: "assistant", content: "old response" },
      { role: "user", content: "My child has a medical condition; call 555-222-3333" },
    ], 1);

    expect(redacted).not.toMatch(/allergy|parent@example\.com|555-222-3333|123 Secret Street/i);
    expect(chat).toHaveLength(1);
    expect(chat[0].content).not.toMatch(/medical|555-222-3333/i);
    expect(chat[0].content).toMatch(/\[(?:sensitive details|name) removed\]/);
  });
});