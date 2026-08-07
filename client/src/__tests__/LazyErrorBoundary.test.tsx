/**
 * Unit tests for LazyErrorBoundary and retryableLazy.
 *
 * Verifies that the section-level error boundary:
 *  1. Shows the "Couldn't load this section" / "Tap to retry" fallback when a
 *     child throws (simulating a chunk-load failure).
 *  2. Re-renders children after the user clicks "Tap to retry" (state is reset).
 *  3. Passes through a lazy chunk rejection that propagates through its inner
 *     Suspense, the same way a real failed dynamic import would behave.
 *  4. Re-invokes the retryableLazy import() factory after retry so the browser
 *     fetches a fresh chunk instead of replaying the cached rejection.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React, { act, lazy, useState } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LazyErrorBoundary, retryableLazy } from "@/components/LazyErrorBoundary";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Silences the React error boundary console noise during tests. */
function suppressConsoleError() {
  return vi.spyOn(console, "error").mockImplementation(() => {});
}

/**
 * A component that unconditionally throws on first render and then renders
 * normally after `reset()` is called — useful for testing retry.
 */
function makeBomb() {
  let shouldThrow = true;
  function Bomb() {
    if (shouldThrow) {
      throw new Error("ChunkLoadError: Loading chunk failed.");
    }
    return <div data-testid="bomb-content">Loaded successfully</div>;
  }
  function reset() {
    shouldThrow = false;
  }
  return { Bomb, reset };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("LazyErrorBoundary", () => {
  let errorSpy: ReturnType<typeof suppressConsoleError>;

  beforeEach(() => {
    errorSpy = suppressConsoleError();
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  it("renders children normally when there is no error", () => {
    render(
      <LazyErrorBoundary>
        <div data-testid="child">hello</div>
      </LazyErrorBoundary>,
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
    expect(screen.queryByText(/couldn't load this section/i)).not.toBeInTheDocument();
  });

  it("shows the retry fallback when a child throws", async () => {
    const { Bomb } = makeBomb();

    render(
      <LazyErrorBoundary>
        <Bomb />
      </LazyErrorBoundary>,
    );

    await waitFor(() =>
      expect(
        screen.getByText(/couldn't load this section/i),
      ).toBeInTheDocument(),
    );

    expect(
      screen.getByRole("button", { name: /tap to retry/i }),
    ).toBeInTheDocument();

    // Children should not be visible while error state is active
    expect(screen.queryByTestId("bomb-content")).not.toBeInTheDocument();
  });

  it("re-renders children after clicking 'Tap to retry'", async () => {
    const user = userEvent.setup();
    const { Bomb, reset } = makeBomb();

    render(
      <LazyErrorBoundary>
        <Bomb />
      </LazyErrorBoundary>,
    );

    // Wait for the fallback UI
    const retryButton = await screen.findByRole("button", {
      name: /tap to retry/i,
    });

    // Fix the underlying "chunk" so the next render succeeds
    reset();

    await user.click(retryButton);

    // After retry the children should render and the error UI should be gone
    await waitFor(() =>
      expect(screen.getByTestId("bomb-content")).toBeInTheDocument(),
    );

    expect(
      screen.queryByText(/couldn't load this section/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /tap to retry/i }),
    ).not.toBeInTheDocument();
  });

  it("catches a lazy chunk rejection propagated through its inner Suspense", async () => {
    const FailingChunk = lazy(() =>
      Promise.reject(new Error("Failed to fetch dynamically imported module")),
    );

    render(
      <LazyErrorBoundary fallback={<div data-testid="suspense-spinner" />}>
        <FailingChunk />
      </LazyErrorBoundary>,
    );

    await waitFor(() =>
      expect(
        screen.getByText(/couldn't load this section/i),
      ).toBeInTheDocument(),
    );

    expect(
      screen.getByRole("button", { name: /tap to retry/i }),
    ).toBeInTheDocument();
  });
});

describe("retryableLazy", () => {
  let errorSpy: ReturnType<typeof suppressConsoleError>;

  beforeEach(() => {
    errorSpy = suppressConsoleError();
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  it("re-invokes the import() factory on retry so a fresh chunk fetch is issued", async () => {
    const user = userEvent.setup();
    let callCount = 0;

    // Factory rejects on the first call and resolves on subsequent calls,
    // simulating a temporarily unavailable chunk that becomes available.
    const LoadedContent = () => <div data-testid="chunk-content">Chunk loaded</div>;
    const factory = vi.fn(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.reject(new Error("Failed to fetch dynamically imported module"));
      }
      return Promise.resolve({ default: LoadedContent });
    });

    const RetryableChunk = retryableLazy(factory);

    render(
      <LazyErrorBoundary fallback={<div data-testid="suspense-spinner" />}>
        <RetryableChunk />
      </LazyErrorBoundary>,
    );

    // First attempt: factory is called once and the error boundary shows fallback UI
    await waitFor(() =>
      expect(screen.getByText(/couldn't load this section/i)).toBeInTheDocument(),
    );
    expect(factory).toHaveBeenCalledTimes(1);

    // Click retry — the boundary should create a fresh lazy type and re-invoke factory
    await user.click(screen.getByRole("button", { name: /tap to retry/i }));

    // Factory must be called a second time (fresh network request for the chunk)
    await waitFor(() =>
      expect(screen.getByTestId("chunk-content")).toBeInTheDocument(),
    );
    expect(factory).toHaveBeenCalledTimes(2);

    // Error UI should be gone after successful load
    expect(screen.queryByText(/couldn't load this section/i)).not.toBeInTheDocument();
  });

  it("shows the fallback UI again if the chunk is still unavailable after retry", async () => {
    const user = userEvent.setup();

    // Factory always rejects — chunk is genuinely unavailable
    const factory = vi.fn(() =>
      Promise.reject(new Error("Failed to fetch dynamically imported module")),
    );

    const RetryableChunk = retryableLazy(factory);

    render(
      <LazyErrorBoundary fallback={<div data-testid="suspense-spinner" />}>
        <RetryableChunk />
      </LazyErrorBoundary>,
    );

    // First failure
    await waitFor(() =>
      expect(screen.getByText(/couldn't load this section/i)).toBeInTheDocument(),
    );

    // Click retry — chunk still unavailable
    await user.click(screen.getByRole("button", { name: /tap to retry/i }));

    // Fallback UI must reappear (no infinite spinner)
    await waitFor(() =>
      expect(screen.getByText(/couldn't load this section/i)).toBeInTheDocument(),
    );
    expect(factory).toHaveBeenCalledTimes(2);
  });
});

// ---------------------------------------------------------------------------
// Stall-detection timeout tests
// ---------------------------------------------------------------------------

describe("LazyErrorBoundary – stall-detection timeout", () => {
  let errorSpy: ReturnType<typeof suppressConsoleError>;

  beforeEach(() => {
    errorSpy = suppressConsoleError();
    vi.useFakeTimers();
  });

  afterEach(() => {
    errorSpy.mockRestore();
    vi.useRealTimers();
  });

  it("shows the error fallback after the timeout when Suspense hangs indefinitely", async () => {
    // A promise that never settles — simulates a stalled dynamic import.
    const StalledChunk = lazy(() => new Promise<never>(() => {}));

    render(
      <LazyErrorBoundary
        fallback={<div data-testid="suspense-spinner" />}
        timeoutMs={8_000}
      >
        <StalledChunk />
      </LazyErrorBoundary>,
    );

    // The Suspense fallback (spinner) should be visible before the timeout.
    expect(screen.getByTestId("suspense-spinner")).toBeInTheDocument();
    expect(screen.queryByText(/couldn't load this section/i)).not.toBeInTheDocument();

    // Advance past the 8 s timeout.
    await act(async () => {
      vi.advanceTimersByTime(8_001);
    });

    // Error fallback must appear and the spinner must be gone.
    expect(screen.getByText(/couldn't load this section/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /tap to retry/i })).toBeInTheDocument();
    expect(screen.queryByTestId("suspense-spinner")).not.toBeInTheDocument();
  });

  it("resets the stall timer when the user clicks 'Tap to retry'", async () => {
    const StalledChunk = lazy(() => new Promise<never>(() => {}));

    render(
      <LazyErrorBoundary
        fallback={<div data-testid="suspense-spinner" />}
        timeoutMs={8_000}
      >
        <StalledChunk />
      </LazyErrorBoundary>,
    );

    // Trigger the first timeout.
    await act(async () => {
      vi.advanceTimersByTime(8_001);
    });

    expect(screen.getByText(/couldn't load this section/i)).toBeInTheDocument();

    // Click retry using fireEvent (avoids userEvent/fake-timer conflicts).
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /tap to retry/i }));
    });

    // Immediately after retry the error UI should be gone.
    expect(screen.queryByText(/couldn't load this section/i)).not.toBeInTheDocument();

    // Advance only halfway through the new timeout — still no error.
    await act(async () => {
      vi.advanceTimersByTime(4_000);
    });
    expect(screen.queryByText(/couldn't load this section/i)).not.toBeInTheDocument();

    // Advance past the full timeout again — error should reappear.
    await act(async () => {
      vi.advanceTimersByTime(4_001);
    });
    expect(screen.getByText(/couldn't load this section/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /tap to retry/i })).toBeInTheDocument();
  }, 15_000);

  it("does not fire the timeout when content loads before the deadline", async () => {
    // A chunk that resolves quickly (synchronously resolved promise).
    const FastContent = () => <div data-testid="fast-content">Loaded</div>;
    const FastChunk = lazy(() => Promise.resolve({ default: FastContent }));

    render(
      <LazyErrorBoundary
        fallback={<div data-testid="suspense-spinner" />}
        timeoutMs={8_000}
      >
        <FastChunk />
      </LazyErrorBoundary>,
    );

    // Flush the resolved lazy promise through React's update queue.
    // Multiple rounds ensure Suspense → LoadSignal → cancelStallTimer all run.
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    // Content should be visible and the stall timer should have been cancelled.
    expect(screen.getByTestId("fast-content")).toBeInTheDocument();

    // Advance past the timeout threshold — no error should fire.
    await act(async () => {
      vi.advanceTimersByTime(8_001);
    });

    expect(screen.queryByText(/couldn't load this section/i)).not.toBeInTheDocument();
    expect(screen.getByTestId("fast-content")).toBeInTheDocument();
  }, 15_000);
});
