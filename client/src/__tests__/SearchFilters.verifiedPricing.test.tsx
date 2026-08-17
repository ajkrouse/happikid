/**
 * Component tests — SearchFilters verified pricing checkbox.
 *
 * Confirms that:
 * 1. The "Verified pricing only" checkbox is rendered.
 * 2. Checking it calls onFiltersChange with verifiedPricing:true.
 * 3. When verifiedPricing is true, the checkbox is checked.
 * 4. Unchecking it calls onFiltersChange with verifiedPricing:undefined (cleared).
 * 5. The "Clear All" button appears when verifiedPricing is true
 *    (i.e. the hasActiveFilters condition in SearchFilters includes verifiedPricing).
 * 6. The "Clear All" button is absent when verifiedPricing is the only filter and it is false.
 * 7. Clicking "Clear All" calls onClearFilters.
 */

import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import SearchFilters from "@/components/SearchFilters";

// ---------------------------------------------------------------------------
// SearchFilters has no network dependencies; no extra mocks needed.
// ---------------------------------------------------------------------------

function renderFilters(
  filters: Parameters<typeof SearchFilters>[0]["filters"] = {},
  onFiltersChange = vi.fn(),
  onClearFilters = vi.fn(),
  verifiedPricingCount?: number | null
) {
  return { onFiltersChange, onClearFilters, ...render(
    <SearchFilters
      filters={filters}
      onFiltersChange={onFiltersChange}
      onClearFilters={onClearFilters}
      verifiedPricingCount={verifiedPricingCount}
    />
  )};
}

describe("SearchFilters — Verified Pricing checkbox", () => {
  it('renders the "Verified pricing only" checkbox', () => {
    renderFilters();
    expect(
      screen.getByLabelText(/Verified pricing only/i)
    ).toBeInTheDocument();
  });

  it("checkbox is unchecked when verifiedPricing is not set", () => {
    renderFilters({});
    const checkbox = screen.getByLabelText(/Verified pricing only/i);
    expect(checkbox).not.toBeChecked();
  });

  it("checkbox is checked when verifiedPricing is true", () => {
    renderFilters({ verifiedPricing: true });
    const checkbox = screen.getByLabelText(/Verified pricing only/i);
    expect(checkbox).toBeChecked();
  });

  it("calls onFiltersChange with verifiedPricing:true when the checkbox is checked", () => {
    const onChange = vi.fn();
    renderFilters({}, onChange);

    fireEvent.click(screen.getByLabelText(/Verified pricing only/i));

    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ verifiedPricing: true })
    );
  });

  it("calls onFiltersChange with verifiedPricing:undefined when the checkbox is unchecked", () => {
    const onChange = vi.fn();
    renderFilters({ verifiedPricing: true }, onChange);

    // Uncheck the already-checked checkbox
    fireEvent.click(screen.getByLabelText(/Verified pricing only/i));

    expect(onChange).toHaveBeenCalledOnce();
    const calledWith = onChange.mock.calls[0][0];
    // When unchecked, the value should be falsy/cleared (false → undefined via `|| undefined`)
    expect(calledWith.verifiedPricing).toBeFalsy();
  });

  it('shows "Clear All" button when verifiedPricing is true (active filter indicator)', () => {
    renderFilters({ verifiedPricing: true });
    expect(
      screen.getByRole("button", { name: /Clear All/i })
    ).toBeInTheDocument();
  });

  it('hides "Clear All" button when no filters are active', () => {
    renderFilters({});
    expect(
      screen.queryByRole("button", { name: /Clear All/i })
    ).not.toBeInTheDocument();
  });

  it('hides "Clear All" button when verifiedPricing is explicitly false', () => {
    renderFilters({ verifiedPricing: false });
    expect(
      screen.queryByRole("button", { name: /Clear All/i })
    ).not.toBeInTheDocument();
  });

  it('calls onClearFilters when "Clear All" is clicked with verifiedPricing active', () => {
    const onClear = vi.fn();
    renderFilters({ verifiedPricing: true }, vi.fn(), onClear);

    fireEvent.click(screen.getByRole("button", { name: /Clear All/i }));

    expect(onClear).toHaveBeenCalledOnce();
  });

  it("verifiedPricing:true alone is sufficient to show the Clear All button", () => {
    // All other filters absent — verifiedPricing alone lights up the active-filter indicator
    renderFilters({
      type: undefined,
      borough: undefined,
      city: undefined,
      ageRange: undefined,
      priceRange: undefined,
      acceptsSubsidies: undefined,
      verifiedPricing: true,
      enrollmentStatus: undefined,
      features: [],
    });
    expect(
      screen.getByRole("button", { name: /Clear All/i })
    ).toBeInTheDocument();
  });

  it("shows the count in the label when verifiedPricingCount is provided", () => {
    renderFilters({}, vi.fn(), vi.fn(), 42);
    expect(screen.getByText(/Verified pricing only \(42\)/i)).toBeInTheDocument();
  });

  it("does not show a count in the label when verifiedPricingCount is null", () => {
    renderFilters({}, vi.fn(), vi.fn(), null);
    // Label text should be exactly "Verified pricing only" without any parenthetical
    expect(screen.getByText(/Verified pricing only$/i)).toBeInTheDocument();
  });

  it("does not show a count in the label when verifiedPricingCount is not supplied", () => {
    renderFilters();
    expect(screen.getByText(/Verified pricing only$/i)).toBeInTheDocument();
  });
});
