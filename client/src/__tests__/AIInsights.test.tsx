import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AIInsightsUnavailable } from "@/components/AIInsights";

describe("AIInsightsUnavailable", () => {
  it("explains that search results remain available when AI is down", () => {
    render(<AIInsightsUnavailable />);

    expect(screen.getByTestId("alert-ai-insights-unavailable")).toHaveTextContent(
      "AI insights are temporarily unavailable. Your search results are still complete.",
    );
  });

  it("renders a server-provided fallback message", () => {
    render(<AIInsightsUnavailable message="AI is rate-limited. Results are still available." />);

    expect(screen.getByTestId("alert-ai-insights-unavailable")).toHaveTextContent(
      "AI is rate-limited. Results are still available.",
    );
  });
});