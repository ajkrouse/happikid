import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AI_REQUEST_TIMEOUT_MS,
  clearAICache,
  createAICacheKey,
  runBoundedCachedAI,
} from "../server/services/aiResilience";

describe("AI request resilience", () => {
  afterEach(() => {
    clearAICache();
    vi.useRealTimers();
  });

  it("reuses successful responses for identical requests", async () => {
    const operation = vi.fn().mockResolvedValue({ summary: "Cached result" });

    await expect(runBoundedCachedAI("same-request", operation)).resolves.toEqual({ summary: "Cached result" });
    await expect(runBoundedCachedAI("same-request", operation)).resolves.toEqual({ summary: "Cached result" });

    expect(operation).toHaveBeenCalledTimes(1);
  });

  it("deduplicates concurrent identical requests", async () => {
    let resolveOperation!: (value: string) => void;
    const operation = vi.fn().mockReturnValue(new Promise<string>((resolve) => {
      resolveOperation = resolve;
    }));

    const first = runBoundedCachedAI("concurrent-request", operation);
    const second = runBoundedCachedAI("concurrent-request", operation);
    resolveOperation("one shared result");

    await expect(first).resolves.toBe("one shared result");
    await expect(second).resolves.toBe("one shared result");
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it("rejects a request that exceeds the bounded AI timeout", async () => {
    vi.useFakeTimers();
    let signal!: AbortSignal;
    const request = runBoundedCachedAI(
      "slow-request",
      (requestSignal) => {
        signal = requestSignal;
        return new Promise<string>(() => {});
      },
      { timeoutMs: AI_REQUEST_TIMEOUT_MS },
    );
    const assertion = expect(request).rejects.toMatchObject({ name: "AITimeoutError" });

    await vi.advanceTimersByTimeAsync(AI_REQUEST_TIMEOUT_MS);
    await assertion;
    expect(signal.aborted).toBe(true);
  });

  it("does not cache failures, allowing a later retry to recover", async () => {
    const operation = vi.fn()
      .mockRejectedValueOnce(new Error("temporary outage"))
      .mockResolvedValueOnce("recovered");

    await expect(runBoundedCachedAI("retry-request", operation)).rejects.toThrow("temporary outage");
    await expect(runBoundedCachedAI("retry-request", operation)).resolves.toBe("recovered");
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it("uses distinct cache keys when any prompt-affecting result count changes", () => {
    const base = { query: "daycare", providerContext: "1. Sunny Days", parsedContext: { confidence: 1 } };

    expect(createAICacheKey("search-summary", { ...base, totalResults: 1 }))
      .not.toBe(createAICacheKey("search-summary", { ...base, totalResults: 10 }));
  });
});