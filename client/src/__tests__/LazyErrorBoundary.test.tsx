/**
 * Unit tests for LazyErrorBoundary.
 *
 * Verifies that the section-level error boundary:
 *  1. Shows the "Couldn't load this section" / "Tap to retry" fallback when a
 *     child throws (simulating a chunk-load failure).
 *  2. Re-renders children after the user clicks "Tap to retry" (state is reset).
 *  3. Passes through a lazy chunk rejection that propagates through its inner
 *     Suspense, the same way a real failed dynamic import would behave.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React, { lazy, useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LazyErrorBoundary } from "@/components/LazyErrorBoundary";

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
