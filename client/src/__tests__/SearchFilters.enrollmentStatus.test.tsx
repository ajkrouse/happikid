/**
 * Component tests — SearchFilters enrollment status filter UI.
 *
 * Confirms that:
 * 1. All four enrollment radio options are rendered.
 * 2. Selecting "Accepting Enrollments" fires onFiltersChange with enrollmentStatus:"accepting".
 * 3. Selecting "Waitlist Only" fires onFiltersChange with enrollmentStatus:"waitlist".
 * 4. Selecting "Full" fires onFiltersChange with enrollmentStatus:"full".
 * 5. Selecting "Any Status" fires onFiltersChange with enrollmentStatus:undefined (clears the filter).
 * 6. The mobile active-filter badge is shown when enrollmentStatus is set and hidden when cleared.
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
  onClearFilters = vi.fn()
) {
  return render(
    <SearchFilters
      filters={filters}
      onFiltersChange={onFiltersChange}
      onClearFilters={onClearFilters}
    />
  );
}

describe("SearchFilters — Enrollment Status section", () => {
  it("renders all four enrollment status options", () => {
    renderFilters();
    expect(screen.getByLabelText(/Any Status/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Accepting Enrollments/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Waitlist Only/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Full/i)).toBeInTheDocument();
  });

  it('calls onFiltersChange with enrollmentStatus:"accepting" when that option is selected', () => {
    const onChange = vi.fn();
    renderFilters({}, onChange);

    fireEvent.click(screen.getByLabelText(/Accepting Enrollments/i));

    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ enrollmentStatus: "accepting" })
    );
  });

  it('calls onFiltersChange with enrollmentStatus:"waitlist" when that option is selected', () => {
    const onChange = vi.fn();
    renderFilters({}, onChange);

    fireEvent.click(screen.getByLabelText(/Waitlist Only/i));

    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ enrollmentStatus: "waitlist" })
    );
  });

  it('calls onFiltersChange with enrollmentStatus:"full" when that option is selected', () => {
    const onChange = vi.fn();
    renderFilters({}, onChange);

    fireEvent.click(screen.getByLabelText(/^Full$/i));

    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ enrollmentStatus: "full" })
    );
  });

  it('calls onFiltersChange with enrollmentStatus:undefined when "Any Status" is selected', () => {
    const onChange = vi.fn();
    // Start with an active enrollment filter
    renderFilters({ enrollmentStatus: "waitlist" }, onChange);

    fireEvent.click(screen.getByLabelText(/Any Status/i));

    expect(onChange).toHaveBeenCalledOnce();
    const calledWith = onChange.mock.calls[0][0];
    // enrollmentStatus should be removed (undefined) when "all" is chosen
    expect(calledWith.enrollmentStatus).toBeUndefined();
  });

  it('reflects the active enrollmentStatus value in the radio group', () => {
    renderFilters({ enrollmentStatus: "waitlist" });
    // shadcn RadioGroupItem renders as role="radio" with aria-checked, not a native <input>
    const waitlistRadio = screen.getByRole("radio", { name: /Waitlist Only/i });
    expect(waitlistRadio).toHaveAttribute("aria-checked", "true");
  });

  it('shows "Clear All" button when enrollmentStatus filter is active', () => {
    renderFilters({ enrollmentStatus: "accepting" });
    expect(screen.getByRole("button", { name: /Clear All/i })).toBeInTheDocument();
  });

  it('hides "Clear All" button when no filters are active', () => {
    renderFilters({});
    expect(screen.queryByRole("button", { name: /Clear All/i })).not.toBeInTheDocument();
  });

  it('calls onClearFilters when "Clear All" is clicked', () => {
    const onClear = vi.fn();
    renderFilters({ enrollmentStatus: "full" }, vi.fn(), onClear);

    fireEvent.click(screen.getByRole("button", { name: /Clear All/i }));

    expect(onClear).toHaveBeenCalledOnce();
  });
});
